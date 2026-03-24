import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL =
    process.env.BASE_URL || "https://cs344-metaverse-1.onrender.com/api";
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

// add this block before any function that calls logInfo/logError/logSuccess
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
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

type TeacherAccount = {
    teacherCode: string;
};

type JoinedStudent = {
    teacher: TeacherAccount;
    name: string;
    email: string;
    studentId: number;
    sessionId: string;
};

const TEACHERS: TeacherAccount[] = [
    {
        teacherCode: "TEACH-390D",
    },
    {
        teacherCode: "TEACH-CC24",
    },
];

const RUN_ID = Date.now();

const STUDENT_PLANS = [
    {
        teacherIndex: 0,
        name: "Harsh Pravin Bhosale",
        rollBase: "202351018",
    },
    {
        teacherIndex: 0,
        name: "Yash Popat Chaudhari",
        rollBase: "202351162",
    },
    {
        teacherIndex: 1,
        name: "Shantanu Sanjay Sawant",
        rollBase: "202352332",
    },
    {
        teacherIndex: 1,
        name: "Atharva Shrikant Patil",
        rollBase: "202351014",
    },
];

const buildStudentsForTeachers = (teachers: TeacherAccount[]) => {
    return STUDENT_PLANS.map((plan) => ({
        teacher: teachers[plan.teacherIndex],
        name: plan.name,
        email: `${plan.rollBase}.${RUN_ID}@iiitvadodara.ac.in`,
    }));
};

async function testHealthCheck() {
    logInfo("Test 1: Health Check");
    const response = await axios.get(`${API_ORIGIN}/health`, {
        timeout: 30000,
    });
    if (response.status !== 200 || response.data.status !== "OK") {
        throw new Error("Health check failed");
    }
    logSuccess("Health check passed");
}

async function joinStudent(
    teacher: TeacherAccount,
    name: string,
    email: string,
): Promise<JoinedStudent> {
    const response = await axios.post(`${BASE_URL}/students/join`, {
        teacher_code: teacher.teacherCode,
        name,
        email,
    });

    if (![200, 201].includes(response.status)) {
        throw new Error(`Join failed for ${name}`);
    }

    const studentId = Number(response.data?.student_id);
    const sessionId = response.data?.session?.session_id;

    const returnedName = String(response.data?.student_full_name || "").trim();
    if (returnedName && returnedName !== name) {
        logWarning(
            `Stored name differs for ${email}. expected="${name}", got="${returnedName}"`,
        );
    }

    if (!studentId || !sessionId) {
        throw new Error(`Invalid join response for ${name}`);
    }

    return { teacher, name, email, studentId, sessionId };
}

async function getSessionActive(): Promise<string> {
    const response = await axios.get(`${BASE_URL}/students/session/active`);
    if (
        response.status !== 200 ||
        !response.data?.success ||
        !response.data?.data?.sessionId
    ) {
        throw new Error("Active session fetch failed");
    }
    return String(response.data.data.sessionId);
}

async function updateScoreWithSession(
    studentId: number,
    sessionId: string,
    score: number,
): Promise<{
    sessionClosed: boolean;
    issued: boolean;
    eligible: boolean;
    tokenId: number | null;
}> {
    try {
        const response = await axios.post(
            `${BASE_URL}/students/update-score/session`,
            {
                student_id: studentId,
                exam_score: score,
                session_id: sessionId,
            },
        );

        if (response.status !== 200 || !response.data?.success) {
            throw new Error(`Update score failed for student ${studentId}`);
        }

        const automation = response.data?.certificateAutomation || {};
        const tokenId =
            automation?.tokenId !== null && automation?.tokenId !== undefined
                ? Number(automation.tokenId)
                : null;

        return {
            sessionClosed: Boolean(response.data?.sessionClosed),
            issued: Boolean(automation?.issued),
            eligible: Boolean(automation?.eligible),
            tokenId: Number.isFinite(tokenId as number)
                ? Number(tokenId)
                : null,
        };
    } catch (error: any) {
        if (error?.response?.status !== 404) {
            throw error;
        }

        logWarning(
            "/students/update-score/session not available on this deployment. Trying legacy session flow...",
        );

        const closeRes = await axios.post(
            `${BASE_URL}/students/session/close`,
            {
                exam_score: score,
            },
        );

        if (closeRes.status !== 200 || !closeRes.data?.success) {
            throw new Error(
                `Legacy close session flow failed for student ${studentId}`,
            );
        }

        if (score < 80) {
            return {
                sessionClosed: true,
                issued: false,
                eligible: false,
                tokenId: null,
            };
        }

        try {
            const issueRes = await axios.post(
                `${BASE_URL}/certificates/issue/session`,
                {
                    studentId,
                    session_id: sessionId,
                },
                { timeout: 120000 },
            );

            const tokenId = Number(issueRes.data?.data?.tokenId);
            return {
                sessionClosed: true,
                issued: issueRes.status === 201,
                eligible: true,
                tokenId: Number.isFinite(tokenId) ? tokenId : null,
            };
        } catch (issueError: any) {
            if (issueError?.response?.status === 409) {
                const tokenId = Number(
                    issueError?.response?.data?.data?.tokenId,
                );
                return {
                    sessionClosed: true,
                    issued: false,
                    eligible: true,
                    tokenId: Number.isFinite(tokenId) ? tokenId : null,
                };
            }

            if (issueError?.response?.status === 404) {
                throw new Error(
                    "Server is missing both /students/update-score/session and /certificates/issue/session. Please deploy latest backend build.",
                );
            }

            throw issueError;
        }
    }
}

async function verifyCertificate(tokenId: number) {
    const byToken = await axios.get(
        `${BASE_URL}/certificates/token/${tokenId}`,
    );
    if (byToken.status !== 200 || !byToken.data?.data) {
        throw new Error(`Get certificate by token failed: ${tokenId}`);
    }

    const verify = await axios.get(
        `${BASE_URL}/certificates/verify/${tokenId}`,
    );
    if (verify.status !== 200 || verify.data?.success !== true) {
        throw new Error(`Verify certificate failed: ${tokenId}`);
    }
}

async function assertNoActiveSession() {
    try {
        await axios.get(`${BASE_URL}/students/session/active`);
        throw new Error("Expected no active session, but one exists");
    } catch (error: any) {
        const status = error?.response?.status;
        if (status !== 404) {
            throw new Error(
                `Expected 404 for no active session, got ${
                    status || "unknown"
                }`,
            );
        }
    }
}

async function run() {
    console.log("\n" + "=".repeat(80));
    log(
        "🎓 UNITY FLOW: JOIN -> UPDATE SCORE (SESSION) -> AUTO CERTIFICATE -> AUTO CLOSE",
        colors.cyan,
    );
    console.log("=".repeat(80));

    logInfo(`Base URL: ${BASE_URL}`);
    await testHealthCheck();

    const studentPlans = buildStudentsForTeachers(TEACHERS);

    logInfo("\nTest 2: Sequentially process students using session-only flow");
    for (const plan of studentPlans) {
        logInfo(
            `\n[Dashboard] Joining ${plan.name} (${plan.email}) for ${plan.teacher.teacherCode}`,
        );

        const student = await joinStudent(plan.teacher, plan.name, plan.email);
        logSuccess(
            `Joined ${student.name} -> studentId=${student.studentId}, sessionId=${student.sessionId}`,
        );

        const activeSessionId = await getSessionActive(); // [VR] fetch active session
        if (activeSessionId !== student.sessionId) {
            throw new Error(
                `Active session mismatch. expected=${student.sessionId}, got=${activeSessionId}`,
            );
        }
        logSuccess(`Session handoff Dashboard -> VR works: ${activeSessionId}`);

        logWarning(
            `Updating score via /students/update-score/session for student ${student.studentId} (auto certificate expected)...`,
        );
        const scoreResult = await updateScoreWithSession(
            student.studentId,
            student.sessionId,
            82,
        );

        if (!scoreResult.sessionClosed) {
            throw new Error(
                `Session was not auto-closed for student ${student.studentId}`,
            );
        }

        if (!scoreResult.eligible) {
            throw new Error(
                `Student ${student.studentId} should be certificate-eligible at score 82`,
            );
        }

        if (!scoreResult.tokenId) {
            throw new Error(
                `Missing tokenId in certificateAutomation for student ${student.studentId}`,
            );
        }

        logSuccess(
            `Score updated and flow completed. issued=${scoreResult.issued}, tokenId=${scoreResult.tokenId}`,
        );

        await assertNoActiveSession();
        logSuccess("Session auto-closed and no active session remains");

        await verifyCertificate(scoreResult.tokenId);
        logSuccess(`Certificate verified. tokenId=${scoreResult.tokenId}`);

        const rejoin = await joinStudent(plan.teacher, plan.name, plan.email);
        logSuccess(
            `Rejoined existing student for duplicate check -> studentId=${rejoin.studentId}`,
        );

        const duplicateRun = await updateScoreWithSession(
            rejoin.studentId,
            rejoin.sessionId,
            95,
        );

        if (duplicateRun.issued) {
            throw new Error(
                `Duplicate certificate was minted for student ${rejoin.studentId}`,
            );
        }

        if (duplicateRun.tokenId !== scoreResult.tokenId) {
            throw new Error(
                `Duplicate flow returned mismatched tokenId. first=${scoreResult.tokenId}, second=${duplicateRun.tokenId}`,
            );
        }

        logSuccess(
            `Duplicate prevention passed. Existing token reused: ${duplicateRun.tokenId}`,
        );
    }

    console.log("\n" + "=".repeat(80));
    logSuccess(
        "✅ Completed: session-only Unity flow with auto-issue, auto-close, and duplicate prevention.",
    );
    console.log("=".repeat(80) + "\n");
}

run().catch((error: any) => {
    const details =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        JSON.stringify(error);
    logError(`\n💥 Flow failed: ${details}`);

    if (error?.response?.status) {
        logError(`HTTP ${error.response.status}`);
    }

    process.exit(1);
});
