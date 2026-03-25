# API Endpoints Documentation (Unity VR + Web)

Base URL: `http://localhost:3000/api`

---

## 1) Authentication Endpoints

### Sign Up (Teacher)

**POST** `/auth/signup` (Public)

```json
{
    "walletAddress": "0x1234567890abcdef...",
    "email": "teacher@example.com",
    "fullName": "John Doe",
    "password": "securePassword123"
}
```

### Login (Teacher)

**POST** `/auth/login` (Public)

```json
{
    "email": "teacher@example.com",
    "password": "securePassword123"
}
```

### Get Profile

**GET** `/auth/profile` (Protected)

Header:

```bash
Authorization: Bearer <jwt_token>
```

---

## 2) Student + Session Endpoints

### Join Student with Teacher Code (create/reuse session)

**POST** `/students/join` (Public)

```json
{
    "teacher_code": "TEACH-91FA",
    "name": "Rahul Sharma",
    "email": "student@example.com"
}
```

Unity must save from response:

-   `session.session_id`
-   `student_id`
-   `teacher_id`

`metaversePayload` already contains exactly what Unity needs.

### Get Active Session

**GET** `/students/session/active` (Public)

### Close Active Session

**POST** `/students/session/close` (Public)

Optional body:

```json
{
    "exam_score": 88
}   
```

### Verify Student Email

**POST** `/students/verify-email` (Public)

### Update Score (Teacher JWT flow)

**POST** `/students/update-score` (Protected)

```json
{
    "student_id": 42,
    "exam_score": 79
}
```

### Update Score (Unity Session flow, no JWT)

**POST** `/students/update-score/session` (Public, session-validated)

```json
{
    "student_id": 42,
    "exam_score": 85,
    "session_id": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8"
}
```

`session_id` can be passed via body/query/header:

-   body: `session_id` or `sessionId`
-   query: `session_id` or `sessionId`
-   header: `x-session-id`

Validation:

-   session must be active
-   session student must match `student_id`
-   session teacher must match student owner

When score is updated:

-   if score `< 80`: certificate is not issued
-   if score `>= 80`: certificate is auto-issued (if not already existing)
-   session is automatically closed at end of update flow

### Get Student by ID

**GET** `/students/get-student/:id` (Protected)

### Get Teacher Students

**GET** `/students/my-students` (Protected)

---

## 3) Certificate Endpoints

### Issue Certificate (Teacher JWT flow only)

**POST** `/certificates/issue` (Protected)

```json
{
    "studentId": 42,
    "teacherId": 1
}
```

Notes:

-   This route is for web/admin manual issuing.
-   Duplicate protection is enabled. If certificate already exists, API returns `409`.

### Get Certificate by Token

**GET** `/certificates/token/:tokenId` (Public)

### Get Certificates by Student

**GET** `/certificates/student/:studentId` (Protected)

### Revoke Certificate

**PUT** `/certificates/:certificateId/revoke` (Protected)

### Verify Certificate on Blockchain

**GET** `/certificates/verify/:tokenId` (Public)

---

## 4) Unity VR Flow (Final)

### Dashboard-to-VR Session Handoff (your use case)

If keyboard/input is not available in VR:

1. Join student from Dashboard using `POST /students/join`.
2. VR calls `GET /students/session/active`.
3. VR gets the same active session and then submits score with `POST /students/update-score/session`.

This is supported in current backend.

### Step 1: Start session

Call `POST /students/join`.

Store:

-   `session_id`
-   `student_id`
-   `teacher_id`

### Step 2: Finish training and submit score

Call `POST /students/update-score/session`.

```json
{
    "student_id": 42,
    "exam_score": 91,
    "session_id": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8"
}
```

### Step 3: Read response

Use `certificateAutomation` from response:

-   `eligible`
-   `issued`
-   `message`
-   `tokenId`
-   `txHash`
-   `ipfsHash`

If `issued = true`, certificate is done. No extra issue API call needed.

### Step 4: Verify (optional)

If `tokenId` is present, verify:

-   `GET /certificates/token/:tokenId`
-   `GET /certificates/verify/:tokenId`

---

## 5) Common Error Codes for Unity Team

-   `400`: invalid payload (missing fields, invalid score)
-   `401`: missing auth/session where required
-   `403`: invalid or inactive session, student mismatch, teacher mismatch
-   `404`: student/session/certificate not found
-   `409`: duplicate certificate attempt
-   `500`: internal error

---

## 6) Auth Summary

### Protected (JWT required)

-   `/auth/profile`
-   `/students/update-score`
-   `/students/my-students`
-   `/students/get-student/:id`
-   `/certificates/issue`
-   `/certificates/student/:studentId`
-   `/certificates/:certificateId/revoke`

### Public (no JWT required)

-   `/auth/signup`
-   `/auth/login`
-   `/students/join`
-   `/students/verify-email`
-   `/students/session/active`
-   `/students/session/close`
-   `/students/update-score/session`
-   `/certificates/token/:tokenId`
-   `/certificates/verify/:tokenId`

---

## 7) Session Model Notes

-   Session storage is in-memory (`TrainingSession.model.ts`), not persisted in DB.
-   On backend restart, active sessions are lost.
-   Current implementation tracks one active session pointer in controller scope.

---

## 8) Important Notes

1. Certificate threshold is **80**.
2. IPFS upload and blockchain mint happen during certificate issuance.
3. Unity should use only `update-score/session` for score + auto-certificate.
4. Session closes automatically after score update flow completes.
