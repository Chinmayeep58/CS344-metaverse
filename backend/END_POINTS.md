# API Endpoints Documentation (Unity + Web)

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

**Unity must save these fields from response:**

-   `session.session_id`
-   `student_id`
-   `teacher_id`

`metaversePayload` already returns all required runtime values for VR.

### Get Active Session

**GET** `/students/session/active` (Public)

Returns the current active session from backend memory.

### Close Active Session

**POST** `/students/session/close` (Public)

Optional body:

```json
{
    "exam_score": 88
}
```

If `exam_score` is provided, backend updates student score when closing session.

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

`session_id` can be passed by:

-   body key `session_id` or `sessionId`
-   query key `session_id` or `sessionId`
-   header `x-session-id`

Validation checks in session flow:

-   session is active
-   `session.studentId === student_id`
-   session teacher matches student owner

### Get Student by ID

**GET** `/students/get-student/:id` (Protected)

### Get Teacher Students

**GET** `/students/my-students` (Protected)

---

## 3) Certificate Endpoints

### Issue Certificate (Teacher JWT flow)

**POST** `/certificates/issue` (Protected)

```json
{
    "studentId": 42,
    "teacherId": 1
}
```

### Issue Certificate (Unity Session flow, no JWT)

**POST** `/certificates/issue/session` (Public, session-validated)

```json
{
    "studentId": 42,
    "session_id": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8"
}
```

Optional `teacherId` may be sent. If sent, it must match active session teacher.

Certificate issue conditions:

-   student exists
-   student has `full_name`, `email`, and `exam_score`
-   `exam_score >= 80`
-   caller is authorized via JWT or valid active session

### Get Certificate by Token

**GET** `/certificates/token/:tokenId` (Public)

### Get Certificates by Student

**GET** `/certificates/student/:studentId` (Protected)

### Revoke Certificate

**PUT** `/certificates/:certificateId/revoke` (Protected)

### Verify Certificate on Blockchain

**GET** `/certificates/verify/:tokenId` (Public)

---

## 4) Unity Flow (What to call and when)

### Step 1: Start session

Call `POST /students/join` when student enters teacher code.

Store:

-   `session_id`
-   `student_id`
-   `teacher_id`

### Step 2: Submit exam score

After VR test finishes, call:

`POST /students/update-score/session`

Body:

```json
{
    "student_id": 42,
    "exam_score": 91,
    "session_id": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8"
}
```

### Step 3: Certificate decision

-   If score `< 80`: do not call issue certificate.
-   If score `>= 80`:
    -   backend may auto-issue in score flow (check `certificateAutomation`), or
    -   call manual issue endpoint below.

### Step 4: Manual certificate issue (if needed)

Call:

`POST /certificates/issue/session`

Body:

```json
{
    "studentId": 42,
    "session_id": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8"
}
```

### Step 5: Optional close session

Call `POST /students/session/close` when done.

---

## 5) Common Error Codes for Unity Team

-   `400`: invalid payload (missing fields, invalid score)
-   `401`: missing token/session auth where needed
-   `403`: invalid/inactive session, student mismatch, teacher mismatch
-   `404`: student/session/certificate not found
-   `500`: server/internal failure

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
-   `/certificates/issue/session`
-   `/certificates/token/:tokenId`
-   `/certificates/verify/:tokenId`

---

## 7) Session Model Notes

-   Session storage is in-memory (`TrainingSession.model.ts`), not persisted.
-   On backend restart, active sessions are lost.
-   Current implementation uses a single active session pointer in controller scope.

---

## 8) Important Notes

1. Certificate threshold is **80**.
2. Certificate metadata is uploaded to IPFS during issuance.
3. Issuance is also recorded on blockchain.
4. Issuance may close active session automatically.
