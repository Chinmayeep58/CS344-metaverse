# API Endpoints Documentation

Base URL: `http://localhost:3000`

---

## Authentication Endpoints

### 1. Sign Up

**POST** `/auth/signup`

Create a new user account.

**Request Body:**

```json
{
    "walletAddress": "0x1234567890abcdef...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "password": "securePassword123"
}
```

**Response (201):**

```json
{
    "message": "User created successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "fullName": "John Doe",
        "walletAddress": "0x1234567890abcdef..."
    }
}
```

---

### 2. Login

**POST** `/auth/login`

Authenticate user and get access token.

**Request Body:**

```json
{
    "email": "user@example.com",
    "password": "securePassword123"
}
```

**Response (200):**

```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "fullName": "John Doe",
        "walletAddress": "0x1234567890abcdef..."
    }
}
```

---

### 3. Get Profile

**GET** `/auth/profile`

Get current authenticated user profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "fullName": "John Doe",
        "walletAddress": "0x1234567890abcdef..."
    }
}
```

---

## Student Endpoints

### 4. Create Student

**POST** `/students`

Create a new student record.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "exam_score": 85
}
```

**Response (201):**

```json
{
    "success": true,
    "message": "Student created successfully",
    "data": {
        "id": 1,
        "full_name": "Jane Smith",
        "email": "jane@example.com",
        "exam_score": 85,
        "created_by": 1,
        "created_at": "2026-02-14T10:30:00.000Z"
    }
}
```

---

### 5. Get Student by ID

**GET** `/students/:id`

Get specific student details.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

-   `id` (number): Student ID

**Response (200):**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "full_name": "Jane Smith",
        "email": "jane@example.com",
        "exam_score": 85,
        "created_by": 1,
        "created_at": "2026-02-14T10:30:00.000Z"
    }
}
```

---

### 6. Get My Students

**GET** `/students/my-students`

Get all students created by the authenticated teacher.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "full_name": "Jane Smith",
            "email": "jane@example.com",
            "exam_score": 85,
            "created_by": 1,
            "created_at": "2026-02-14T10:30:00.000Z"
        },
        {
            "id": 2,
            "full_name": "John Doe",
            "email": "john@example.com",
            "exam_score": 92,
            "created_by": 1,
            "created_at": "2026-02-14T11:00:00.000Z"
        }
    ]
}
```

**Error Responses:**

-   `401`: Unauthorized
-   `500`: Internal server error

---

## Certificate Endpoints

### 7. Issue Certificate

**POST** `/certificates/issue`

Issue a blockchain certificate for a student (requires exam score ≥ 70).

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
    "studentId": 1
}
```

**Response (201):**

```json
{
    "success": true,
    "message": "Certificate issued successfully",
    "data": {
        "tokenId": 1,
        "txHash": "0xabc123def456...",
        "ipfsHash": "QmXyZ789...",
        "certificate": {
            "id": 1,
            "student_id": 1,
            "token_id": 1,
            "tx_hash": "0xabc123def456...",
            "ipfs_hash": "QmXyZ789...",
            "issued_by": 1,
            "issued_at": "2026-02-14T12:00:00.000Z",
            "revoked": false
        }
    }
}
```

---

### 8. Get Certificate by Token ID

**GET** `/certificates/token/:tokenId`

Get certificate details by blockchain token ID (Public - No auth required).

**URL Parameters:**

-   `tokenId` (number): Blockchain token ID

**Response (200):**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "student_id": 1,
        "token_id": 1,
        "tx_hash": "0xabc123def456...",
        "ipfs_hash": "QmXyZ789...",
        "issued_by": 1,
        "issued_at": "2026-02-14T12:00:00.000Z",
        "revoked": false,
        "revoked_at": null
    }
}
```

---

### 9. Get Student Certificates

**GET** `/certificates/student/:studentId`

Get all certificates for a specific student.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

-   `studentId` (number): Student ID

**Response (200):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "student_id": 1,
            "token_id": 1,
            "tx_hash": "0xabc123def456...",
            "ipfs_hash": "QmXyZ789...",
            "issued_by": 1,
            "issued_at": "2026-02-14T12:00:00.000Z",
            "revoked": false,
            "revoked_at": null
        }
    ]
}
```

**Error Responses:**

-   `401`: Unauthorized
-   `500`: Internal server error

---

### 10. Revoke Certificate

**PUT** `/certificates/:certificateId/revoke`

Revoke an issued certificate on blockchain.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

-   `certificateId` (number): Token ID of the certificate to revoke

**Response (200):**

```json
{
    "success": true,
    "message": "Certificate revoked successfully",
    "data": {
        "certificate": {
            "id": 1,
            "student_id": 1,
            "token_id": 1,
            "tx_hash": "0xabc123def456...",
            "ipfs_hash": "QmXyZ789...",
            "issued_by": 1,
            "issued_at": "2026-02-14T12:00:00.000Z",
            "revoked": true,
            "revoked_at": "2026-02-14T13:00:00.000Z"
        },
        "txHash": "0xdef789ghi012..."
    }
}
```

---

### 11. Verify Certificate

**GET** `/certificates/verify/:tokenId`

Verify certificate authenticity on blockchain (Public - No auth required).

**URL Parameters:**

-   `tokenId` (number): Blockchain token ID

**Response (200):**

```json
{
    "success": true,
    "data": {
        "exists": true,
        "isRevoked": false,
        "certificateData": {
            "tokenId": 1,
            "studentName": "Jane Smith",
            "studentEmail": "jane@example.com",
            "examScore": 85,
            "issuedAt": 1708862400,
            "ipfsHash": "QmXyZ789...",
            "issuer": "0x1234567890abcdef...",
            "revoked": false
        }
    }
}
```

---

## Authentication Notes

**Protected Routes** require an `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

**Public Routes** (No authentication required):

-   `GET /certificates/token/:tokenId`
-   `GET /certificates/verify/:tokenId`

---

## Smart Contract Functions (DisasterCertificate.sol)

The backend interacts with these blockchain functions:

1. **issueCertificate** - Mints NFT certificate with metadata
2. **revokeCertificate** - Marks certificate as revoked on-chain
3. **getCertificate** - Retrieves certificate data from blockchain
4. **verifyCertificate** - Checks if certificate exists and is valid

---

## Important Notes

1. **Exam Score Requirement**: Certificates can only be issued for students with exam_score ≥ 70
2. **JWT Token**: Save the token from login/signup and include it in Authorization header for protected routes
3. **Student Data**: Students must have `full_name`, `email`, and `exam_score` before issuing certificates
4. **IPFS**: Certificate metadata is automatically uploaded to IPFS during issuance
5. **Blockchain**: All certificate operations are recorded on the blockchain with transaction hashes

---
