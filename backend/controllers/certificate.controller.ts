import type { Request, Response } from "express";
import { getStudentById } from "../models/Student.model";
import {
    createCertificate,
    getCertificateByTokenId as getDbCertificateByTokenId,
    getCertificatesByStudent as getDbCertificatesByStudent,
    revokeCertificate as revokeDbCertificate,
} from "../models/Certificate.model";
import { uploadMetadataToIPFS } from "../services/ipfs.service";
import {
    issueCertificateOnChain,
    revokeCertificateOnChain,
    verifyCertificateOnChain,
} from "../services/blockchain.service";
import { sendCertificateIssuedEmail } from "../services/mail.service";
import {
    closeActiveSessionByStudentId,
    getActiveTrainingSessionById,
} from "../models/TrainingSession.model";

const getSessionIdFromRequest = (req: Request): string | null => {
    const bodySessionId =
        (req.body as any)?.session_id ?? (req.body as any)?.sessionId;
    const querySessionId =
        (req.query as any)?.session_id ?? (req.query as any)?.sessionId;
    const headerSessionId = req.headers["x-session-id"];

    const candidate = bodySessionId ?? querySessionId ?? headerSessionId;
    if (!candidate) return null;
    const normalized = Array.isArray(candidate) ? candidate[0] : candidate;
    return String(normalized).trim() || null;
};

export const issueCertificate = async (req: Request, res: Response) => {
    try {
        const { studentId, teacherId } = req.body;
        const userId = (req as any).user?.id;
        const sessionId = getSessionIdFromRequest(req);

        const parsedStudentId = Number(studentId);
        if (!Number.isFinite(parsedStudentId)) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
            });
        }

        const student = await getStudentById(parsedStudentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        if (
            !student.full_name ||
            !student.email ||
            student.exam_score === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Student must have full_name, email, and exam_score",
            });
        }

        if (student.exam_score < 80) {
            return res.status(400).json({
                success: false,
                message: "Student exam score must be at least 80",
            });
        }

        if (teacherId !== undefined && !Number.isFinite(Number(teacherId))) {
            return res.status(400).json({
                success: false,
                message: "teacherId must be a valid number",
            });
        }

        let resolvedTeacherId: number;

        if (userId) {
            resolvedTeacherId = Number(userId);

            if (
                student.created_by &&
                resolvedTeacherId !== Number(student.created_by)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Teacher ID does not match student owner",
                });
            }
        } else {
            if (!sessionId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication token or session_id is required to issue certificate",
                });
            }

            const session = getActiveTrainingSessionById(sessionId);

            if (!session) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid or inactive session",
                });
            }

            if (Number(session.studentId) !== Number(parsedStudentId)) {
                return res.status(403).json({
                    success: false,
                    message: "Session does not belong to this student",
                });
            }

            resolvedTeacherId = Number(session.teacherId);

            if (
                student.created_by &&
                resolvedTeacherId !== Number(student.created_by)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Session teacher mismatch for this student",
                });
            }

            if (
                teacherId !== undefined &&
                Number(teacherId) !== resolvedTeacherId
            ) {
                return res.status(403).json({
                    success: false,
                    message: "teacherId does not match active session teacher",
                });
            }
        }

        const metadata = {
            name: `VR Disaster Training Certificate - ${student.full_name}`,
            description: `This certificate confirms that ${student.full_name} has successfully completed the VR Disaster Training program with a score of ${student.exam_score}.`,
            image: "ipfs://QmYourDefaultImageHash",
            attributes: [
                { trait_type: "Student Name", value: student.full_name },
                { trait_type: "Email", value: student.email },
                { trait_type: "Exam Score", value: student.exam_score },
                {
                    trait_type: "Completion Date",
                    value: new Date().toISOString(),
                },
                {
                    trait_type: "Status",
                    value: student.exam_score >= 90 ? "Excellent" : "Pass",
                },
            ],
        };

        const ipfsHash = await uploadMetadataToIPFS(metadata);

        const { tokenId, txHash } = await issueCertificateOnChain(
            student.full_name,
            student.email,
            student.exam_score,
            ipfsHash,
        );

        const certificate = await createCertificate({
            student_id: parsedStudentId,
            token_id: tokenId,
            tx_hash: txHash,
            ipfs_hash: ipfsHash,
            issued_by: resolvedTeacherId,
        });

        let emailSent = false;
        try {
            emailSent = await sendCertificateIssuedEmail({
                recipientEmail: student.email,
                studentName: student.full_name,
                examScore: student.exam_score,
                tokenId,
                txHash,
                ipfsHash,
                issueDate: new Date(certificate.issued_at).toISOString(),
            });
        } catch (emailError) {
            console.error(
                "Certificate issued, but email sending failed:",
                emailError,
            );
        }

        const closedSession = closeActiveSessionByStudentId(parsedStudentId);

        return res.status(201).json({
            success: true,
            message: "Certificate issued successfully",
            data: {
                tokenId,
                txHash,
                ipfsHash,
                emailSent,
                certificate,
                sessionClosed: Boolean(closedSession),
                closedSessionId: closedSession?.sessionId || null,
            },
        });
    } catch (error: any) {
        console.error("Error issuing certificate:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to issue certificate",
            error: error.message || "Internal server error",
        });
    }
};

export const getCertificateByToken = async (req: Request, res: Response) => {
    try {
        const { tokenId } = req.params;
        const certificate = await getDbCertificateByTokenId(Number(tokenId));

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: certificate,
        });
    } catch (error: any) {
        console.error("Error fetching certificate:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch certificate",
            error: error.message || "Internal server error",
        });
    }
};

export const getCertificatesByStudentId = async (
    req: Request,
    res: Response,
) => {
    try {
        const { studentId } = req.params;
        const certificates = await getDbCertificatesByStudent(
            Number(studentId),
        );

        return res.status(200).json({
            success: true,
            data: certificates,
        });
    } catch (error: any) {
        console.error("Error fetching student certificates:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch student certificates",
            error: error.message || "Internal server error",
        });
    }
};

export const revokeCertificateById = async (req: Request, res: Response) => {
    try {
        const { certificateId } = req.params;
        const certificate = await getDbCertificateByTokenId(
            Number(certificateId),
        );

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found",
            });
        }

        if (certificate.revoked) {
            return res.status(400).json({
                success: false,
                message: "Certificate already revoked",
            });
        }

        const txHash = await revokeCertificateOnChain(certificate.token_id);
        const updatedCertificate = await revokeDbCertificate(certificate.id);

        return res.status(200).json({
            success: true,
            message: "Certificate revoked successfully",
            data: {
                certificate: updatedCertificate,
                txHash,
            },
        });
    } catch (error: any) {
        console.error("Error revoking certificate:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to revoke certificate",
            error: error.message || "Internal server error",
        });
    }
};

export const verifyCertificate = async (req: Request, res: Response) => {
    try {
        const { tokenId } = req.params;
        const result = await verifyCertificateOnChain(Number(tokenId));

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("Error verifying certificate:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify certificate",
            error: error.message || "Internal server error",
        });
    }
};
