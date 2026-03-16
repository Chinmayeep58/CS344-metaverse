import axios from "axios";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3000/api";
const DEPLOYER_WALLET = "0x63A22B04addD5E8fd248bf10D5c7D48233957050"; // From deployments.json

// Test data
let authToken: string;
let studentId: number;
let certificateTokenId: number;

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
    log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
    log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
    log(`ℹ ${message}`, colors.blue);
}

function logWarning(message: string) {
    log(`⚠ ${message}`, colors.yellow);
}

// Test 1: Health Check
async function testHealthCheck() {
    try {
        logInfo("Test 1: Health Check");
        const response = await axios.get("http://localhost:3000/health");

        if (response.status === 200 && response.data.status === "OK") {
            logSuccess("Health check passed");
            return true;
        }
        throw new Error("Health check failed");
    } catch (error: any) {
        logError(`Health check failed: ${error.message}`);
        return false;
    }
}

// Test 2: User Signup
async function testSignup() {
    try {
        logInfo("\nTest 2: User Signup");
        const timestamp = Date.now();
        const response = await axios.post(`${BASE_URL}/auth/signup`, {
            walletAddress: DEPLOYER_WALLET,
            email: `teacher${timestamp}@test.com`,
            fullName: "Test Teacher",
            password: "Test@123456",
        });

        if (response.status === 201 && response.data.token) {
            authToken = response.data.token;
            logSuccess("Signup successful");
            logInfo(`Token: ${authToken.substring(0, 20)}...`);
            logInfo(`User ID: ${response.data.user.id}`);
            return true;
        }
        throw new Error("Signup failed");
    } catch (error: any) {
        if (error.response?.status === 409) {
            logWarning("User already exists, attempting login instead");
            return await testLoginExisting();
        }
        logError(
            `Signup failed: ${error.response?.data?.message || error.message}`,
        );
        return false;
    }
}

// Test 2b: Login with existing user
async function testLoginExisting() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: `teacher${Date.now() - 10000}@test.com`,
            password: "Test@123456",
        });

        if (response.status === 200 && response.data.token) {
            authToken = response.data.token;
            logSuccess("Login successful with existing user");
            return true;
        }

        // If this specific user doesn't exist, create a new one
        const timestamp = Date.now();
        const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
            walletAddress: DEPLOYER_WALLET,
            email: `teacher${timestamp}@test.com`,
            fullName: "Test Teacher",
            password: "Test@123456",
        });
        authToken = signupResponse.data.token;
        logSuccess("Created new user and logged in");
        return true;
    } catch (error: any) {
        logError(
            `Login failed: ${error.response?.data?.message || error.message}`,
        );
        return false;
    }
}

// Test 3: Get Profile
async function testGetProfile() {
    try {
        logInfo("\nTest 3: Get Profile");
        const response = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 && response.data.user) {
            logSuccess("Profile retrieved successfully");
            logInfo(`Email: ${response.data.user.email}`);
            logInfo(`Wallet: ${response.data.user.walletAddress}`);
            return true;
        }
        throw new Error("Get profile failed");
    } catch (error: any) {
        logError(
            `Get profile failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

// Test 4: Create Student
async function testCreateStudent() {
    try {
        logInfo("\nTest 4: Create Student");
        const timestamp = Date.now();
        const response = await axios.post(
            `${BASE_URL}/students`,
            {
                full_name: `John Doe ${timestamp}`,
                email: `student${timestamp}@test.com`,
                exam_score: 85,
            },
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        if (response.status === 201 && response.data.data) {
            studentId = response.data.data.id;
            logSuccess("Student created successfully");
            logInfo(`Student ID: ${studentId}`);
            logInfo(`Name: ${response.data.data.full_name}`);
            logInfo(`Score: ${response.data.data.exam_score}`);
            return true;
        }
        throw new Error("Create student failed");
    } catch (error: any) {
        logError(
            `Create student failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

// Test 5: Get Student
async function testGetStudent() {
    try {
        logInfo("\nTest 5: Get Student");
        const response = await axios.get(`${BASE_URL}/students/${studentId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 && response.data.data) {
            logSuccess("Student retrieved successfully");
            logInfo(`Name: ${response.data.data.full_name}`);
            return true;
        }
        throw new Error("Get student failed");
    } catch (error: any) {
        logError(
            `Get student failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

// Test 6: Get Teacher's Students
async function testGetTeacherStudents() {
    try {
        logInfo("\nTest 6: Get Teacher's Students");
        const response = await axios.get(`${BASE_URL}/students/my-students`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 && Array.isArray(response.data.data)) {
            logSuccess(`Retrieved ${response.data.data.length} students`);
            return true;
        }
        throw new Error("Get teacher students failed");
    } catch (error: any) {
        logError(
            `Get teacher students failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

// Test 7: Issue Certificate (Blockchain Transaction)
async function testIssueCertificate() {
    try {
        logInfo("\nTest 7: Issue Certificate (Blockchain Transaction)");
        logWarning("⏳ This may take 15-30 seconds on Sepolia testnet...");

        const response = await axios.post(
            `${BASE_URL}/certificates/issue`,
            {
                studentId: studentId,
            },
            {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: 60000, // 60 second timeout
            },
        );

        if (response.status === 201 && response.data.data) {
            certificateTokenId = response.data.data.tokenId;
            logSuccess("✨ Certificate issued successfully!");
            logInfo(`Token ID: ${response.data.data.tokenId}`);
            logInfo(`Transaction Hash: ${response.data.data.txHash}`);
            logInfo(`IPFS Hash: ${response.data.data.ipfsHash}`);
            log(
                `🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${response.data.data.txHash}`,
                colors.cyan,
            );
            return true;
        }
        throw new Error("Issue certificate failed");
    } catch (error: any) {
        logError(
            `Issue certificate failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        if (error.code === "ECONNABORTED") {
            logWarning(
                "Request timed out. The transaction might still be processing.",
            );
        }
        return false;
    }
}

// Test 8: Get Certificate from Database
async function testGetCertificate() {
    try {
        logInfo("\nTest 8: Get Certificate from Database");
        const response = await axios.get(
            `${BASE_URL}/certificates/token/${certificateTokenId}`,
        );

        if (response.status === 200 && response.data.data) {
            logSuccess("Certificate retrieved from database");
            logInfo(`Token ID: ${response.data.data.token_id}`);
            logInfo(`TX Hash: ${response.data.data.tx_hash}`);
            logInfo(`Revoked: ${response.data.data.revoked}`);
            return true;
        }
        throw new Error("Get certificate failed");
    } catch (error: any) {
        logError(
            `Get certificate failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

// Test 9: Verify Certificate on Blockchain
async function testVerifyCertificate() {
    try {
        logInfo("\nTest 9: Verify Certificate on Blockchain");
        logWarning("🔍 Checking blockchain...");

        const response = await axios.get(
            `${BASE_URL}/certificates/verify/${certificateTokenId}`,
            {
                timeout: 30000,
            },
        );

        if (response.status === 200 && response.data.data) {
            const { isValid, certificate } = response.data.data;
            if (isValid) {
                logSuccess("✅ Certificate verified on blockchain!");
                logInfo(`Student: ${certificate.studentName}`);
                logInfo(`Email: ${certificate.studentEmail}`);
                logInfo(`Score: ${certificate.examScore}`);
                logInfo(
                    `Issued: ${new Date(
                        certificate.issueDate * 1000,
                    ).toLocaleString()}`,
                );
                logInfo(`Revoked: ${certificate.revoked}`);
                return true;
            } else {
                logWarning(
                    "Certificate exists but is not valid (possibly revoked)",
                );
                return true;
            }
        }
        throw new Error("Verify certificate failed");
    } catch (error: any) {
        logError(
            `Verify certificate failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

// Test 10: Get Student's Certificates
async function testGetStudentCertificates() {
    try {
        logInfo("\nTest 10: Get Student's Certificates");
        const response = await axios.get(
            `${BASE_URL}/certificates/student/${studentId}`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        if (response.status === 200 && Array.isArray(response.data.data)) {
            logSuccess(
                `📜 Student has ${response.data.data.length} certificate(s)`,
            );
            return true;
        }
        throw new Error("Get student certificates failed");
    } catch (error: any) {
        logError(
            `Get student certificates failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log("\n" + "=".repeat(70));
    log("🎓 VR DISASTER TRAINING METAVERSE - INTEGRATION TESTS", colors.cyan);
    console.log("=".repeat(70));

    logInfo(`\n📡 Base URL: ${BASE_URL}`);
    logInfo(`👤 Deployer Wallet: ${DEPLOYER_WALLET}`);
    logInfo(`📄 Contract: ${process.env.CONTRACT_ADDRESS}`);
    logInfo(`🌐 Network: Sepolia Testnet`);
    console.log("=".repeat(70));

    const results = {
        passed: 0,
        failed: 0,
        total: 0,
    };

    const tests = [
        { name: "Health Check", fn: testHealthCheck, critical: true },
        { name: "User Signup/Login", fn: testSignup, critical: true },
        { name: "Get Profile", fn: testGetProfile, critical: false },
        { name: "Create Student", fn: testCreateStudent, critical: true },
        { name: "Get Student", fn: testGetStudent, critical: false },
        {
            name: "Get Teacher Students",
            fn: testGetTeacherStudents,
            critical: false,
        },
        {
            name: "Issue Certificate (Blockchain)",
            fn: testIssueCertificate,
            critical: true,
        },
        {
            name: "Get Certificate (Database)",
            fn: testGetCertificate,
            critical: false,
        },
        {
            name: "Verify Certificate (Blockchain)",
            fn: testVerifyCertificate,
            critical: false,
        },
        {
            name: "Get Student Certificates",
            fn: testGetStudentCertificates,
            critical: false,
        },
    ];

    for (const test of tests) {
        results.total++;
        const success = await test.fn();
        if (success) {
            results.passed++;
        } else {
            results.failed++;
            if (test.critical) {
                logError(
                    `\n❌ Critical test "${test.name}" failed. Stopping execution.`,
                );
                break;
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    log("📊 TEST SUMMARY", colors.cyan);
    console.log("=".repeat(70));
    logInfo(`Total Tests: ${results.total}`);
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
        logError(`Failed: ${results.failed}`);
    }

    const successRate = ((results.passed / results.total) * 100).toFixed(2);
    if (results.failed === 0) {
        log(
            `\n🎉 ALL TESTS PASSED! Success rate: ${successRate}%`,
            colors.green,
        );
    } else {
        log(
            `\n⚠️  Some tests failed. Success rate: ${successRate}%`,
            colors.yellow,
        );
    }
    console.log("=".repeat(70) + "\n");

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
    logError(`\n💥 Unexpected error: ${error.message}`);
    process.exit(1);
});
