import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000/api";

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
    fullName: string;
    email: string;
    walletAddress: string;
    teacherCode: string;
    password: string;
};

type TeacherSession = TeacherAccount & {
    id: number;
    token: string;
};

type JoinedStudent = {
    teacher: TeacherSession;
    name: string;
    email: string;
    studentId: number;
    sessionId: string;
    certificateTokenId?: number;
};

const TEACHERS: TeacherAccount[] = [
    {
        fullName: "Test Teacher",
        email: "teacher1773681775735@test.com",
        walletAddress: "0x63A22B04addD5E8fd248bf10D5c7D48233957050",
        teacherCode: "TEACH-390D",
        password: process.env.TEACHER1_PASSWORD || "Test@123456",
    },
    {
        fullName: "Samadhan Subhash Erande",
        email: "erandesamadhan2003@gmail.com",
        walletAddress: "0xcA1B4c790D5B3F7A27817237F03936c43474AC39",
        teacherCode: "TEACH-CC24",
        password: process.env.TEACHER2_PASSWORD || "samadhan",
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

const normalizeInstituteEmail = (email: string): string => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed.endsWith("@iiitvadodara.ac")) return `${trimmed}.in`;
    return trimmed;
};

const buildStudentsForTeachers = (teachers: TeacherSession[]) => {
    return STUDENT_PLANS.map((plan) => ({
        teacher: teachers[plan.teacherIndex],
        name: plan.name,
        email: `${plan.rollBase}.${RUN_ID}@iiitvadodara.ac.in`,
    }));
};

async function testHealthCheck() {
    logInfo("Test 1: Health Check");
    const response = await axios.get("http://localhost:3000/health");
    if (response.status !== 200 || response.data.status !== "OK") {
        throw new Error("Health check failed");
    }
    logSuccess("Health check passed");
}

async function loginTeacher(teacher: TeacherAccount): Promise<TeacherSession> {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: teacher.email,
        password: teacher.password,
    });

    if (
        response.status !== 200 ||
        !response.data?.token ||
        !response.data?.user
    ) {
        throw new Error(`Login failed for ${teacher.email}`);
    }

    const gotCode = response.data.user.teacherCode;
    if (gotCode !== teacher.teacherCode) {
        logWarning(
            `Teacher code mismatch for ${teacher.email}. Expected ${teacher.teacherCode}, got ${gotCode}`,
        );
    }

    return {
        ...teacher,
        id: Number(response.data.user.id),
        token: response.data.token,
    };
}

async function joinStudent(
    teacher: TeacherSession,
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
    const teacherId = Number(response.data?.teacher_id);
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
    if (teacherId !== teacher.id) {
        throw new Error(
            `Teacher mismatch in join for ${name}. expected=${teacher.id}, got=${teacherId}`,
        );
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

async function closeSession(sessionId: string, score: number) {
    const response = await axios.post(
        `${BASE_URL}/students/session/${sessionId}/close`,
        { exam_score: score },
    );
    if (response.status !== 200 || !response.data?.success) {
        throw new Error(`Close session failed for session ${sessionId}`);
    }
}

async function updateScore(
    teacher: TeacherSession,
    studentId: number,
    score: number,
) {
    const response = await axios.post(
        `${BASE_URL}/students/update-score`,
        { student_id: studentId, exam_score: score },
        { headers: { Authorization: `Bearer ${teacher.token}` } },
    );

    if (response.status !== 200 || !response.data?.success) {
        throw new Error(`Update score failed for student ${studentId}`);
    }
}

async function getStudentCertificates(
    teacher: TeacherSession,
    studentId: number,
): Promise<any[]> {
    const response = await axios.get(
        `${BASE_URL}/certificates/student/${studentId}`,
        {
            headers: { Authorization: `Bearer ${teacher.token}` },
        },
    );

    if (response.status !== 200 || !Array.isArray(response.data?.data)) {
        throw new Error(`Get certificates failed for student ${studentId}`);
    }

    return response.data.data;
}

async function issueCertificate(
    teacher: TeacherSession,
    studentId: number,
): Promise<number> {
    logWarning(
        `Issuing certificate for student ${studentId} (blockchain call)...`,
    );
    const response = await axios.post(
        `${BASE_URL}/certificates/issue`,
        { studentId, teacherId: teacher.id },
        {
            headers: { Authorization: `Bearer ${teacher.token}` },
            timeout: 120000,
        },
    );

    const tokenId = Number(response.data?.data?.tokenId);
    if (response.status !== 201 || !Number.isFinite(tokenId)) {
        throw new Error(`Issue certificate failed for student ${studentId}`);
    }

    return tokenId;
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

async function validateTeacherStudentsList(teacher: TeacherSession) {
    const response = await axios.get(`${BASE_URL}/students/my-students`, {
        headers: { Authorization: `Bearer ${teacher.token}` },
    });

    if (response.status !== 200 || !Array.isArray(response.data?.data)) {
        throw new Error(`Get my-students failed for teacher ${teacher.email}`);
    }
}

async function getCurrentActiveSessionId(): Promise<string> {
    const response = await axios.get(`${BASE_URL}/students/session/active`);
    if (
        response.status !== 200 ||
        !response.data?.success ||
        !response.data?.data?.sessionId
    ) {
        throw new Error("Failed to fetch current active session");
    }
    return String(response.data.data.sessionId);
}

async function closeCurrentSession(score: number) {
    const response = await axios.post(`${BASE_URL}/students/session/close`, {
        exam_score: score,
    });
    if (response.status !== 200 || !response.data?.success) {
        throw new Error("Failed to close current active session");
    }
}

async function run() {
    console.log("\n" + "=".repeat(80));
    log(
        "🎓 SEQUENTIAL FLOW: JOIN 1 STUDENT -> COMPLETE TRAINING -> ISSUE CERTIFICATE",
        colors.cyan,
    );
    console.log("=".repeat(80));

    logInfo(`Base URL: ${BASE_URL}`);
    await testHealthCheck();

    logInfo("\nTest 2: Login both teachers");
    const teacherSessions: TeacherSession[] = [];
    for (const teacher of TEACHERS) {
        const session = await loginTeacher(teacher);
        teacherSessions.push(session);
        logSuccess(`Logged in: ${session.fullName} (${session.teacherCode})`);
    }

    const studentPlans = buildStudentsForTeachers(teacherSessions);

    logInfo(
        "\nTest 3: Sequentially process students (one active session at a time)",
    );
    for (const plan of studentPlans) {
        logInfo(
            `\nJoining ${plan.name} (${plan.email}) for ${plan.teacher.teacherCode}`,
        );

        const student = await joinStudent(plan.teacher, plan.name, plan.email);
        logSuccess(
            `Joined ${student.name} -> studentId=${student.studentId}, sessionId=${student.sessionId}`,
        );

        const activeSessionId = await getSessionActive();
        if (activeSessionId !== student.sessionId) {
            throw new Error(
                `Active session mismatch. expected=${student.sessionId}, got=${activeSessionId}`,
            );
        }
        logSuccess(`Session is active: ${activeSessionId}`);

        await closeCurrentSession(82);
        logSuccess(
            "Training completed and current session closed with exam_score=82",
        );

        // certificate.controller.ts route coverage
        const tokenId = await issueCertificate(plan.teacher, student.studentId);
        logSuccess(
            `Certificate issued via /certificates/issue. tokenId=${tokenId}`,
        );

        await verifyCertificate(tokenId);
        logSuccess(`Certificate verified. tokenId=${tokenId}`);

        await validateTeacherStudentsList(plan.teacher);
        logSuccess(
            `Teacher students list validated for ${plan.teacher.teacherCode}`,
        );
    }

    console.log("\n" + "=".repeat(80));
    logSuccess(
        "✅ Completed: sequential training + certificate issuance for all students.",
    );
    console.log("=".repeat(80) + "\n");
}

run().catch((error: any) => {
    logError(
        `\n💥 Flow failed: ${error.response?.data?.message || error.message}`,
    );
    process.exit(1);
});
