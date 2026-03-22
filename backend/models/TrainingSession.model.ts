import { randomUUID } from "crypto";

export type TrainingSessionStatus = "active" | "closed";

export interface TrainingSession {
    sessionId: string;
    studentId: number;
    teacherId: number;
    teacherCode: string;
    studentName: string;
    studentEmail: string;
    status: TrainingSessionStatus;
    startedAt: string;
    endedAt: string | null;
}

const sessionsById = new Map<string, TrainingSession>();
const activeSessionByStudent = new Map<number, string>();

export const createOrReuseTrainingSession = (input: {
    studentId: number;
    teacherId: number;
    teacherCode: string;
    studentName: string;
    studentEmail: string;
}): { session: TrainingSession; reused: boolean } => {
    const activeSessionId = activeSessionByStudent.get(input.studentId);
    if (activeSessionId) {
        const existing = sessionsById.get(activeSessionId);
        if (existing && existing.status === "active") {
            return { session: existing, reused: true };
        }
        activeSessionByStudent.delete(input.studentId);
    }

    const session: TrainingSession = {
        sessionId: randomUUID(),
        studentId: input.studentId,
        teacherId: input.teacherId,
        teacherCode: input.teacherCode,
        studentName: input.studentName,
        studentEmail: input.studentEmail,
        status: "active",
        startedAt: new Date().toISOString(),
        endedAt: null,
    };

    sessionsById.set(session.sessionId, session);
    activeSessionByStudent.set(input.studentId, session.sessionId);

    return { session, reused: false };
};

export const getTrainingSessionById = (
    sessionId: string,
): TrainingSession | null => sessionsById.get(sessionId) || null;

export const getActiveTrainingSessionById = (
    sessionId: string,
): TrainingSession | null => {
    const session = sessionsById.get(sessionId);
    if (!session || session.status !== "active") return null;
    return session;
};

export const closeTrainingSessionById = (
    sessionId: string,
): TrainingSession | null => {
    const session = sessionsById.get(sessionId);
    if (!session || session.status !== "active") return null;

    session.status = "closed";
    session.endedAt = new Date().toISOString();
    sessionsById.set(sessionId, session);
    activeSessionByStudent.delete(session.studentId);

    return session;
};

export const closeActiveSessionByStudentId = (
    studentId: number,
): TrainingSession | null => {
    const sessionId = activeSessionByStudent.get(studentId);
    if (!sessionId) return null;
    return closeTrainingSessionById(sessionId);
};
