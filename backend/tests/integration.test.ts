import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000/api";
const DEPLOYER_WALLET = "0x63A22B04addD5E8fd248bf10D5c7D48233957050";

let authToken: string;
let teacherId: number;
let teacherCode: string;

let studentId: number;
let studentEmail: string;
let certificateTokenId: number;

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

async function expectStatus(
    title: string,
    fn: () => Promise<any>,
    expectedStatus: number,
): Promise<boolean> {
    try {
        await fn();
        logError(
            `${title}: expected status ${expectedStatus}, but request succeeded`,
        );
        return false;
    } catch (error: any) {
        const actual = error?.response?.status;
        if (actual === expectedStatus) {
            logSuccess(`${title}: got expected ${expectedStatus}`);
            return true;
        }
        logError(
            `${title}: expected ${expectedStatus}, got ${actual || "unknown"}`,
        );
        return false;
    }
}

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

async function testSignup() {
    try {
        logInfo("\nTest 2: Teacher Signup");
        const timestamp = Date.now();
        const response = await axios.post(`${BASE_URL}/auth/signup`, {
            walletAddress: DEPLOYER_WALLET,
            email: `teacher${timestamp}@test.com`,
            fullName: "Test Teacher",
            password: "Test@123456",
        });

        if (
            response.status === 201 &&
            response.data.token &&
            response.data.user
        ) {
            authToken = response.data.token;
            teacherId = response.data.user.id;
            teacherCode = response.data.user.teacherCode;
            logSuccess("Signup successful");
            logInfo(`Teacher ID: ${teacherId}`);
            logInfo(`Teacher Code: ${teacherCode}`);
            return true;
        }

        throw new Error("Signup failed");
    } catch (error: any) {
        logError(
            `Signup failed: ${error.response?.data?.message || error.message}`,
        );
        return false;
    }
}

async function testProfile() {
    try {
        logInfo("\nTest 3: Get Profile");
        const response = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 && response.data.user?.teacherCode) {
            logSuccess("Profile retrieved with teacherCode");
            return true;
        }

        throw new Error("Profile response missing teacherCode");
    } catch (error: any) {
        logError(
            `Get profile failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

async function testJoinInvalidTeacherCode() {
    logInfo("\nTest 4: Join Student (invalid teacher_code)");
    return expectStatus(
        "Join with invalid teacher_code",
        () =>
            axios.post(`${BASE_URL}/students/join`, {
                teacher_code: "TEACH-XXXX",
                name: "Invalid Join",
                email: `invalid-${Date.now()}@test.com`,
            }),
        404,
    );
}

async function testJoinStudent() {
    try {
        logInfo("\nTest 5: Join Student with teacher_code");
        const timestamp = Date.now();
        studentEmail = `student${timestamp}@test.com`;

        const response = await axios.post(`${BASE_URL}/students/join`, {
            teacher_code: teacherCode,
            name: `John Doe ${timestamp}`,
            email: studentEmail,
        });

        if (response.status === 201 && response.data.student_id) {
            studentId = response.data.student_id;
            if (Number(response.data.teacher_id) !== Number(teacherId)) {
                throw new Error("teacher_id mismatch in join response");
            }
            logSuccess("Student joined successfully");
            logInfo(`Student ID: ${studentId}`);
            return true;
        }

        throw new Error("Join student failed");
    } catch (error: any) {
        logError(
            `Join student failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

async function testJoinDuplicateEmail() {
    logInfo("\nTest 6: Join Student duplicate email (same teacher)");
    return expectStatus(
        "Duplicate student email for same teacher",
        () =>
            axios.post(`${BASE_URL}/students/join`, {
                teacher_code: teacherCode,
                name: "Duplicate Student",
                email: studentEmail,
            }),
        409,
    );
}

async function testGetStudent() {
    try {
        logInfo("\nTest 7: Get Student by ID");
        const response = await axios.get(
            `${BASE_URL}/students/get-student/${studentId}`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        if (response.status === 200 && response.data.data?.id === studentId) {
            logSuccess("Student fetched successfully");
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

async function testGetTeacherStudents() {
    try {
        logInfo("\nTest 8: Get Teacher Students");
        const response = await axios.get(`${BASE_URL}/students/my-students`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200 && Array.isArray(response.data.data)) {
            logSuccess(`Retrieved ${response.data.data.length} student(s)`);
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

async function updateScore(score: number): Promise<boolean> {
    const response = await axios.post(
        `${BASE_URL}/students/update-score`,
        {
            student_id: studentId,
            exam_score: score,
        },
        {
            headers: { Authorization: `Bearer ${authToken}` },
        },
    );

    return response.status === 200;
}

async function testUpdateScoreEdgeInvalid() {
    logInfo("\nTest 9: Update Score invalid range (101)");
    return expectStatus(
        "Update score with 101",
        () =>
            axios.post(
                `${BASE_URL}/students/update-score`,
                { student_id: studentId, exam_score: 101 },
                { headers: { Authorization: `Bearer ${authToken}` } },
            ),
        400,
    );
}

async function testScore70IssueShouldFail() {
    try {
        logInfo("\nTest 10: Score = 70 then issue certificate should fail");
        await updateScore(70);

        const ok = await expectStatus(
            "Issue certificate with score 70",
            () =>
                axios.post(
                    `${BASE_URL}/certificates/issue`,
                    { studentId, teacherId },
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                        timeout: 30000,
                    },
                ),
            400,
        );

        return ok;
    } catch (error: any) {
        logError(
            `Score 70 case failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

async function testScore79IssueShouldFail() {
    try {
        logInfo("\nTest 11: Score = 79 then issue certificate should fail");
        await updateScore(79);

        const ok = await expectStatus(
            "Issue certificate with score 79",
            () =>
                axios.post(
                    `${BASE_URL}/certificates/issue`,
                    { studentId, teacherId },
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                        timeout: 30000,
                    },
                ),
            400,
        );

        return ok;
    } catch (error: any) {
        logError(
            `Score 79 case failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

async function testScore80IssueShouldPass() {
    try {
        logInfo("\nTest 12: Score = 80 then issue certificate should pass");
        await updateScore(80);
        logWarning("⏳ Blockchain tx may take 15-30 seconds...");

        const response = await axios.post(
            `${BASE_URL}/certificates/issue`,
            { studentId, teacherId },
            {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: 90000,
            },
        );

        if (
            response.status === 201 &&
            response.data.data?.tokenId !== undefined
        ) {
            certificateTokenId = response.data.data.tokenId;
            logSuccess("Certificate issued at boundary score 80");
            logInfo(`Token ID: ${certificateTokenId}`);
            return true;
        }

        throw new Error("Issue at score 80 failed");
    } catch (error: any) {
        logError(
            `Score 80 issuance failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        if (error.code === "ECONNABORTED") {
            logWarning("Timeout occurred; transaction may still be pending.");
        }
        return false;
    }
}

async function testScoreAbove80Update() {
    try {
        logInfo("\nTest 13: Score > 80 (95) update check");
        const ok = await updateScore(95);
        if (!ok) throw new Error("Score update failed");

        const response = await axios.get(
            `${BASE_URL}/students/get-student/${studentId}`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        if (
            response.status === 200 &&
            Number(response.data.data?.exam_score) === 95
        ) {
            logSuccess("Score above 80 persisted successfully");
            return true;
        }

        throw new Error("Stored score mismatch for >80 case");
    } catch (error: any) {
        logError(
            `Score >80 case failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

async function testGetCertificateByToken() {
    try {
        logInfo("\nTest 14: Get Certificate by Token");
        const response = await axios.get(
            `${BASE_URL}/certificates/token/${certificateTokenId}`,
        );

        if (
            response.status === 200 &&
            response.data.data?.token_id !== undefined
        ) {
            logSuccess("Certificate found in DB");
            return true;
        }

        throw new Error("Certificate lookup failed");
    } catch (error: any) {
        logError(
            `Get certificate failed: ${
                error.response?.data?.message || error.message
            }`,
        );
        return false;
    }
}

async function testVerifyCertificate() {
    try {
        logInfo("\nTest 15: Verify Certificate on chain");
        const response = await axios.get(
            `${BASE_URL}/certificates/verify/${certificateTokenId}`,
            { timeout: 30000 },
        );

        if (response.status === 200 && response.data.data) {
            logSuccess("Verification response received");
            return true;
        }

        throw new Error("Verify failed");
    } catch (error: any) {
        logError(
            `Verify failed: ${error.response?.data?.message || error.message}`,
        );
        return false;
    }
}

async function testGetStudentCertificates() {
    try {
        logInfo("\nTest 16: Get Student Certificates");
        const response = await axios.get(
            `${BASE_URL}/certificates/student/${studentId}`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            },
        );

        if (response.status === 200 && Array.isArray(response.data.data)) {
            logSuccess(
                `Student has ${response.data.data.length} certificate(s)`,
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

async function runAllTests() {
    console.log("\n" + "=".repeat(72));
    log(
        "🎓 VR DISASTER TRAINING METAVERSE - UPDATED INTEGRATION TESTS",
        colors.cyan,
    );
    console.log("=".repeat(72));

    const results = { passed: 0, failed: 0, total: 0 };

    const tests = [
        { name: "Health Check", fn: testHealthCheck, critical: true },
        { name: "Teacher Signup", fn: testSignup, critical: true },
        { name: "Get Profile", fn: testProfile, critical: true },
        {
            name: "Join Invalid teacher_code",
            fn: testJoinInvalidTeacherCode,
            critical: false,
        },
        { name: "Join Student", fn: testJoinStudent, critical: true },
        {
            name: "Join Duplicate Email",
            fn: testJoinDuplicateEmail,
            critical: false,
        },
        { name: "Get Student", fn: testGetStudent, critical: false },
        {
            name: "Get Teacher Students",
            fn: testGetTeacherStudents,
            critical: false,
        },
        {
            name: "Update Score Invalid",
            fn: testUpdateScoreEdgeInvalid,
            critical: false,
        },
        {
            name: "Issue with 70 should fail",
            fn: testScore70IssueShouldFail,
            critical: true,
        },
        {
            name: "Issue with 79 should fail",
            fn: testScore79IssueShouldFail,
            critical: true,
        },
        {
            name: "Issue with 80 should pass",
            fn: testScore80IssueShouldPass,
            critical: true,
        },
        {
            name: "Score >80 update",
            fn: testScoreAbove80Update,
            critical: false,
        },
        {
            name: "Get Certificate",
            fn: testGetCertificateByToken,
            critical: false,
        },
        {
            name: "Verify Certificate",
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

        await new Promise((resolve) => setTimeout(resolve, 900));
    }

    console.log("\n" + "=".repeat(72));
    log("📊 TEST SUMMARY", colors.cyan);
    console.log("=".repeat(72));
    logInfo(`Base URL: ${BASE_URL}`);
    logInfo(`Teacher Wallet: ${DEPLOYER_WALLET}`);
    logInfo(`Teacher ID: ${teacherId || "N/A"}`);
    logInfo(`Teacher Code: ${teacherCode || "N/A"}`);
    logInfo(`Total: ${results.total}`);
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
        logError(`Failed: ${results.failed}`);
    }

    const successRate = ((results.passed / results.total) * 100).toFixed(2);
    log(
        `Success Rate: ${successRate}%`,
        results.failed ? colors.yellow : colors.green,
    );
    console.log("=".repeat(72) + "\n");

    process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
    logError(`\n💥 Unexpected error: ${error.message}`);
    process.exit(1);
});
