# API Endpoints Documentation (Updated)

Base URL: `http://localhost:3000/api`

---

## Authentication Endpoints

### 1) Sign Up (Teacher)

**POST** `/auth/signup`

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

**POST** `/auth/login`

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

```
Authorization: Bearer <token>
```

---

## Student Endpoints

### 4) Join Student with Teacher Code

**POST** `/students/join` (Public)

**Request Body**

```json
{
    "teacher_code": "TEACH-91FA",
    "name": "Rahul Sharma",
    "email": "202351098@iiitvadodara.ac.in"
}
```

**Response (201)**

```json
{
    "success": true,
    "teacher_wallet": "0x1234567890abcdef...",
    "teacher_id": 1,
    "student_id": 42
}
```

**Common Errors**

-   `400`: Missing fields / invalid email
-   `400`: Email verification failed (only `*@iiitvadodara.ac.in` allowed)
-   `404`: Invalid teacher code
-   `409`: Duplicate student email for same teacher

### 4.1) Verify Student Email (No OTP)

**POST** `/students/verify-email` (Public)

**Request Body**

```json
{
    "email": "student@iiitvadodara.ac.in"
}
```

**Response (200/400)**

```json
{
    "success": true,
    "email": "student@iiitvadodara.ac.in",
    "message": "Institute email is valid (iiitvadodara.ac.in)"
}
```

### 5) Update Student Score

**POST** `/students/update-score` (Protected)

**Request Body**

```json
{
    "student_id": 42,
    "exam_score": 79
}
```

**Rules**

-   score must be number in `0..100`
-   only the owning teacher can update score
-   if score is `>= 80`, backend automatically attempts to issue certificate and send email

**Automation info in response**

`certificateAutomation` object is returned with status for auto-issue/email.

### 6) Get Student by ID

**GET** `/students/get-student/:id` (Protected)

### 7) Get My Students

**GET** `/students/my-students` (Protected)

---

## Certificate Endpoints

### 8) Issue Certificate

**POST** `/certificates/issue` (Protected)

> Certificate is issued only when `exam_score >= 80`.

**Request Body**

```json
{
    "studentId": 42,
    "teacherId": 1
}
```

`teacherId` is optional. If provided, it must match student owner. Backend validates teacher ownership.

**Response (201)**

```json
{
    "success": true,
    "message": "Certificate issued successfully",
    "data": {
        "tokenId": 1,
        "txHash": "0xabc123...",
        "ipfsHash": "QmXyZ...",
        "certificate": {
            "id": 1,
            "student_id": 42,
            "token_id": 1,
            "tx_hash": "0xabc123...",
            "ipfs_hash": "QmXyZ...",
            "issued_by": 1,
            "revoked": false,
            "issued_at": "2026-03-16T12:00:00.000Z"
        }
    }
}
```

**Common Errors**

-   `400`: missing studentId, invalid teacherId, or score below 80
-   `403`: teacher mismatch with student owner
-   `404`: student not found

### 9) Get Certificate by Token

**GET** `/certificates/token/:tokenId` (Public)

### 10) Get Certificates by Student

**GET** `/certificates/student/:studentId` (Protected)

### 11) Revoke Certificate

**PUT** `/certificates/:certificateId/revoke` (Protected)

### 12) Verify Certificate on Blockchain

**GET** `/certificates/verify/:tokenId` (Public)

---

## Auth Requirements

Protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

Public endpoints:

-   `POST /students/join`
-   `GET /certificates/token/:tokenId`
-   `GET /certificates/verify/:tokenId`

---

## Testing Profiles (Ready to Use)

Use these sample profiles for manual API testing in Postman/Insomnia.

### Teacher Test Profile

```json
{
    "id": 1,
    "walletAddress": "0x63A22B04addD5E8fd248bf10D5c7D48233957050",
    "email": "teacher1742148695993@test.com",
    "fullName": "Test Teacher",
    "password": "Test@123456",
    "teacherCode": "TEACH-390D"
}
```

> Note: `teacherCode` is auto-generated at signup, so it will be different on every fresh run.

### Student Test Profiles (3-4)

```json
[
    {
        "teacher_code": "TEACH-91FA",
        "name": "Rahul Sharma",
        "email": "rahul.sharma@student.com",
        "exam_score": 70,
        "expected_certificate": false
    },
    {
        "teacher_code": "TEACH-91FA",
        "name": "Priya Verma",
        "email": "priya.verma@student.com",
        "exam_score": 79,
        "expected_certificate": false
    },
    {
        "teacher_code": "TEACH-91FA",
        "name": "Arjun Patil",
        "email": "arjun.patil@student.com",
        "exam_score": 80,
        "expected_certificate": true
    },
    {
        "teacher_code": "TEACH-91FA",
        "name": "Neha Kulkarni",
        "email": "neha.kulkarni@student.com",
        "exam_score": 92,
        "expected_certificate": true
    }
]
```

### Suggested Test Order

1. Sign up teacher with wallet `0x63A22B04addD5E8fd248bf10D5c7D48233957050`
2. Login and copy JWT token
3. Join students using `/students/join`
4. Update score with `/students/update-score`
5. Try `/certificates/issue` and verify:
    - score 70/79 → should fail
    - score 80/92 → should pass

---

## Important Notes

1. Certificate score threshold is **80** (not 70).
2. Student onboarding is through `/students/join` using `teacher_code`.
3. Score update is separate via `/students/update-score`.
4. Minting logic is unchanged in smart contract (`_safeMint(msg.sender, tokenId)`).
5. Certificate metadata is uploaded to IPFS automatically during issuance.
