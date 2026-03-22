# API Endpoints Documentation (Updated)

Base URL: `http://localhost:3000/api`

---

## Authentication Endpoints

### 1) Sign Up (Teacher)

**POST** `/auth/signup` (Public)

**Request Body**

```json
{
    "walletAddress": "0x1234567890abcdef...",
    "email": "teacher@example.com",
    "fullName": "John Doe",
    "password": "securePassword123"
}
```

**Response (201)**

```json
{
    "message": "User created successfully",
    "token": "eyJhbGciOi...",
    "user": {
        "id": 1,
        "email": "teacher@example.com",
        "fullName": "John Doe",
        "walletAddress": "0x1234567890abcdef...",
        "teacherCode": "TEACH-91FA"
    }
}
```

### 2) Login

**POST** `/auth/login` (Public)

**Request Body**

```json
{
    "email": "teacher@example.com",
    "password": "securePassword123"
}
```

**Response (200)**

```json
{
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "user": {
        "id": 1,
        "email": "teacher@example.com",
        "fullName": "John Doe",
        "walletAddress": "0x1234567890abcdef...",
        "teacherCode": "TEACH-91FA"
    }
}
```

### 3) Get Profile

**GET** `/auth/profile` (Protected)

Headers:

```bash
Authorization: Bearer <token>
```

---

## Student Endpoints

### 4) Join Student with Teacher Code + Create/Reuse Session

**POST** `/students/join` (Public)

**Request Body**

```json
{
    "teacher_code": "TEACH-91FA",
    "name": "Rahul Sharma",
    "email": "202351098@iiitvadodara.ac.in"
}
```

**Response (201 or 200)**

```json
{
    "success": true,
    "teacher_wallet": "0x1234567890abcdef...",
    "teacher_id": 1,
    "student_id": 42,
    "student_full_name": "Rahul Sharma",
    "student_email": "rahul@email.com",
    "message": "Student joined and session created successfully",
    "session": {
        "session_id": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8",
        "status": "active",
        "started_at": "2026-03-21T11:22:33.000Z",
        "reused": false
    },
    "metaversePayload": {
        "session_id": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8",
        "student_id": 42,
        "teacher_id": 1,
        "student_name": "Rahul Sharma",
        "student_email": "rahul@email.com"
    }
}
```

**Notes**

-   `400`: Missing fields / invalid email
-   `404`: Invalid teacher code
-   `409`: Duplicate student email for same teacher

### 5) Update Student Score

**POST** `/students/update-score` (Protected)

**Request Body**

```json
{
    "student_id": 42,
    "exam_score": 79
}
```

**Behavior**

-   score must be number in `0..100`
-   only the owning teacher can update score

### 9) Get Student by ID

**GET** `/students/get-student/:id` (Protected)

### 10) Get My Students

**GET** `/students/my-students` (Protected)

---

## Certificate Endpoints

### 11) Issue Certificate

**POST** `/certificates/issue` (Protected)

> Certificate is issued only when `exam_score >= 80`.

**Request Body**

```json
{
    "studentId": 42,
    "teacherId": 1
}
```

`teacherId` is optional. If provided, must be a valid number and match student owner.

**Response (201)**

```json
{
    "success": true,
    "message": "Certificate issued successfully",
    "data": {
        "tokenId": 1,
        "txHash": "0xabc123...",
        "ipfsHash": "QmXyZ...",
        "emailSent": true,
        "certificate": {
            "id": 1,
            "student_id": 42,
            "token_id": 1,
            "tx_hash": "0xabc123...",
            "ipfs_hash": "QmXyZ...",
            "issued_by": 1,
            "revoked": false,
            "issued_at": "2026-03-16T12:00:00.000Z"
        },
        "sessionClosed": true,
        "closedSessionId": "7fd6f8af-8bd1-4c08-9b8f-2eaf95f02ad8"
    }
}
```

### 12) Get Certificate by Token

**GET** `/certificates/token/:tokenId` (Public)

### 13) Get Certificates by Student

**GET** `/certificates/student/:studentId` (Protected)

### 14) Revoke Certificate

**PUT** `/certificates/:certificateId/revoke` (Protected)

### 15) Verify Certificate on Blockchain

**GET** `/certificates/verify/:tokenId` (Public)

---

## Auth Requirements

Protected endpoints require:

```bash
Authorization: Bearer <jwt_token>
```

Public endpoints include:

-   `/auth/signup`
-   `/auth/login`
-   `/students/join`
-   `/students/verify-email`
-   `/students/session/:sessionId/active`
-   `/students/session/:sessionId/close`
-   `/certificates/token/:tokenId`
-   `/certificates/verify/:tokenId`

---

## Session Model Notes (Current Implementation)

-   Session storage is in-memory (`TrainingSession.model.ts`), not persisted to DB.
-   One active session pointer is tracked globally in controller (`currentActiveSessionId`).
-   `current` alias resolves to this global active session id.
-   If server restarts, session memory is cleared.

---

## Important Notes

1. Certificate score threshold is **80**.
2. Student onboarding is through `/students/join` using `teacher_code`.
3. Session lifecycle is now available publicly for metaverse integration.
4. Certificate issuance may close active session automatically.
5. Certificate metadata is uploaded to IPFS during issuance.

## Team Shared Access (Teacher Accounts)

Use these for local team testing/access.

### Teacher Test Profile


```json
[
    {
        "id": 1,
        "wallet_address": "0x63A22B04addD5E8fd248bf10D5c7D48233957050",
        "email": "teacher1773681775735@test.com",
        "full_name": "Test Teacher",
        "password": "Test@123456"
        "teacher_code": "TEACH-390D",
    },
    {
        "id": 2,
        "wallet_address": "0xcA1B4c790D5B3F7A27817237F03936c43474AC39",
        "email": "erandesamadhan2003@gmail.com",
        "full_name": "Samadhan Subhash Erande",
        "password": "samadhan",
        "teacher_code": "TEACH-CC24",
    }
]
```
