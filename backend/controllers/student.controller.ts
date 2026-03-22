import type { Request, Response } from "express";
import {
    createStudent,
    getStudentById,
    getAllStudentsByTeacher,
    getStudentByEmailAndTeacher,
    updateStudentExamScore,
} from "../models/Student.model";
import { getUserByTeacherCode } from "../models/User.model";
import {
    createCertificate,
    getCertificatesByStudent,
} from "../models/Certificate.model";
import { uploadMetadataToIPFS } from "../services/ipfs.service";
import { issueCertificateOnChain } from "../services/blockchain.service";
import { sendCertificateIssuedEmail } from "../services/mail.service";
import { verifyEmailAddress } from "../services/email-verification.service";
import {
    createOrReuseTrainingSession,
    getActiveTrainingSessionById,
    closeTrainingSessionById,
    closeActiveSessionByStudentId,
} from "../models/TrainingSession.model";

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// single active session pointer (project-level assumption: one active session at a time)
let currentActiveSessionId: string | null = null;

// single-session helper:
const getCurrentSessionId = (): string | null => currentActiveSessionId;

export const updateStudentScore = async (req: Request, res: Response) => {
    try {
        const { student_id, exam_score } = req.body;
        const userId = (req as any).user?.id;

        if (!student_id || exam_score === undefined) {
            return res.status(400).json({
                success: false,
                message: "student_id and exam_score are required",
            });
        }

        if (!Number.isFinite(Number(exam_score))) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam_score",
            });
        }

        const parsedScore = Number(exam_score);
        if (parsedScore < 0 || parsedScore > 100) {
            return res.status(400).json({
                success: false,
                message: "exam_score must be between 0 and 100",
            });
        }

        const student = await getStudentById(Number(student_id));

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        if (!userId || Number(student.created_by) !== Number(userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this student",
            });
        }

        const updatedStudent = await updateStudentExamScore(
            Number(student_id),
            parsedScore,
        );

        let certificateAutomation: {
            eligible: boolean;
            issued: boolean;
            emailSent: boolean;
            message: string;
        } = {
            eligible: parsedScore >= 80,
            issued: false,
            emailSent: false,
            message: "Score below 80, certificate not eligible",
        };

        if (
            updatedStudent &&
            parsedScore >= 80 &&
            updatedStudent.full_name &&
            updatedStudent.email
        ) {
            const existingCertificates = await getCertificatesByStudent(
                updatedStudent.id,
            );

            if (existingCertificates.length > 0) {
                certificateAutomation = {
                    eligible: true,
                    issued: false,
                    emailSent: false,
                    message:
                        "Certificate already exists for this student; skipped auto-issue",
                };
            } else {
                try {
                    const metadata = {
                        name: `VR Disaster Training Certificate - ${updatedStudent.full_name}`,
                        description: `This certificate confirms that ${updatedStudent.full_name} has successfully completed the VR Disaster Training program with a score of ${parsedScore}.`,
                        image: "ipfs://QmYourDefaultImageHash",
                        attributes: [
                            {
                                trait_type: "Student Name",
                                value: updatedStudent.full_name,
                            },
                            {
                                trait_type: "Email",
                                value: updatedStudent.email,
                            },
                            { trait_type: "Exam Score", value: parsedScore },
                            {
                                trait_type: "Completion Date",
                                value: new Date().toISOString(),
                            },
                            {
                                trait_type: "Status",
                                value: parsedScore >= 90 ? "Excellent" : "Pass",
                            },
                        ],
                    };

                    const ipfsHash = await uploadMetadataToIPFS(metadata);
                    const { tokenId, txHash } = await issueCertificateOnChain(
                        updatedStudent.full_name,
                        updatedStudent.email,
                        parsedScore,
                        ipfsHash,
                    );

                    const certificate = await createCertificate({
                        student_id: updatedStudent.id,
                        token_id: tokenId,
                        tx_hash: txHash,
                        ipfs_hash: ipfsHash,
                        issued_by: Number(userId),
                    });

                    const emailSent = await sendCertificateIssuedEmail({
                        recipientEmail: updatedStudent.email,
                        studentName: updatedStudent.full_name,
                        examScore: parsedScore,
                        tokenId,
                        txHash,
                        ipfsHash,
                        issueDate: new Date(
                            certificate.issued_at,
                        ).toISOString(),
                    });

                    certificateAutomation = {
                        eligible: true,
                        issued: true,
                        emailSent,
                        message: "Certificate auto-issued because score is 80+",
                    };
                } catch (autoIssueError: any) {
                    certificateAutomation = {
                        eligible: true,
                        issued: false,
                        emailSent: false,
                        message: `Auto-issue failed: ${
                            autoIssueError.message || autoIssueError
                        }`,
                    };
                }
            }
        }

        const closedSession = updatedStudent
            ? closeActiveSessionByStudentId(updatedStudent.id)
            : null;

        if (
            closedSession?.sessionId &&
            currentActiveSessionId === closedSession.sessionId
        ) {
            currentActiveSessionId = null;
        }

        return res.status(200).json({
            success: true,
            message: "Student exam score updated successfully",
            data: updatedStudent,
            certificateAutomation,
            sessionClosed: Boolean(closedSession),
            closedSessionId: closedSession?.sessionId || null,
        });
    } catch (error: any) {
        console.error("Error updating student exam score:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update student exam score",
            error: error.message || "Internal server error",
        });
    }
};

export const joinStudentWithTeacherCode = async (
    req: Request,
    res: Response,
) => {
    try {
        const { teacher_code, name, email } = req.body;

        if (!teacher_code || !name || !email) {
            return res.status(400).json({
                success: false,
                message: "teacher_code, name and email are required",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        const emailVerification = await verifyEmailAddress(String(email));
        if (!emailVerification.isValid) {
            return res.status(400).json({
                success: false,
                message: `Email verification failed: ${emailVerification.reason}`,
            });
        }

        const teacher = await getUserByTeacherCode(String(teacher_code));

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Invalid teacher_code",
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        const existingStudent = await getStudentByEmailAndTeacher(
            normalizedEmail,
            teacher.id,
        );

        const student =
            existingStudent ||
            (await createStudent({
                full_name: normalizedName,
                email: normalizedEmail,
                created_by: teacher.id,
            }));

        const { session, reused } = createOrReuseTrainingSession({
            studentId: student.id,
            teacherId: teacher.id,
            teacherCode: String(teacher_code),
            studentName: student.full_name,
            studentEmail: student.email || "",
        });

        currentActiveSessionId = session.sessionId;

        return res.status(existingStudent ? 200 : 201).json({
            success: true,
            teacher_wallet: teacher.wallet_address,
            teacher_id: teacher.id,
            student_id: student.id,
            student_full_name: student.full_name,
            student_email: student.email,
            message: existingStudent
                ? "Student found and session activated"
                : "Student joined and session created successfully",
            session: {
                session_id: session.sessionId,
                status: session.status,
                started_at: session.startedAt,
                reused,
            },
            metaversePayload: {
                session_id: session.sessionId,
                student_id: session.studentId,
                teacher_id: session.teacherId,
                student_name: session.studentName,
                student_email: session.studentEmail,
            },
        });
    } catch (error: any) {
        if (error?.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Student email already exists for this teacher",
            });
        }

        console.error("Error joining student:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to join student",
            error: error.message || "Internal server error",
        });
    }
};

export const getStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const student = await getStudentById(Number(id));

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: student,
        });
    } catch (error: any) {
        console.error("Error fetching student:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch student",
            error: error.message || "Internal server error",
        });
    }
};

export const getTeacherStudents = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const students = await getAllStudentsByTeacher(userId);

        return res.status(200).json({
            success: true,
            data: students,
        });
    } catch (error: any) {
        console.error("Error fetching students:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch students",
            error: error.message || "Internal server error",
        });
    }
};

export const verifyStudentEmailAddress = async (
    req: Request,
    res: Response,
) => {
    try {
        const { email } = req.body;

        const result = await verifyEmailAddress(String(email || ""));

        return res.status(result.isValid ? 200 : 400).json({
            success: result.isValid,
            email,
            message: result.reason,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Email verification failed",
            error: error.message || "Internal server error",
        });
    }
};

export const getActiveStudentSession = async (req: Request, res: Response) => {
    try {
        const sessionId = getCurrentSessionId();

        if (!sessionId) {
            return res.status(404).json({
                success: false,
                message: "No active session found",
            });
        }

        const session = getActiveTrainingSessionById(sessionId);

        if (!session) {
            if (currentActiveSessionId === sessionId) {
                currentActiveSessionId = null;
            }
            return res.status(404).json({
                success: false,
                message: "No active session found",
            });
        }

        return res.status(200).json({
            success: true,
            data: session,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch active session",
            error: error.message || "Internal server error",
        });
    }
};

export const closeStudentSession = async (req: Request, res: Response) => {
    try {
        const sessionId = getCurrentSessionId();
        const { exam_score } = req.body || {};

        if (!sessionId) {
            return res.status(404).json({
                success: false,
                message: "No active session found",
            });
        }

        const session = getActiveTrainingSessionById(sessionId);
        if (!session) {
            if (currentActiveSessionId === sessionId) {
                currentActiveSessionId = null;
            }
            return res.status(404).json({
                success: false,
                message: "No active session found",
            });
        }

        let parsedScore: number | null = null;
        if (exam_score !== undefined) {
            if (!Number.isFinite(Number(exam_score))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid exam_score",
                });
            }
            parsedScore = Number(exam_score);
            if (parsedScore < 0 || parsedScore > 100) {
                return res.status(400).json({
                    success: false,
                    message: "exam_score must be between 0 and 100",
                });
            }
        }

        const closed = closeTrainingSessionById(sessionId);

        let scoreUpdated = false;
        if (closed && parsedScore !== null) {
            await updateStudentExamScore(closed.studentId, parsedScore);
            scoreUpdated = true;
        }

        if (currentActiveSessionId === sessionId) {
            currentActiveSessionId = null;
        }

        return res.status(200).json({
            success: true,
            message: "Session closed successfully",
            data: closed,
            scoreUpdated,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Failed to close session",
            error: error.message || "Internal server error",
        });
    }
};
