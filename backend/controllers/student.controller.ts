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

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

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
                        issueDate: new Date(certificate.issued_at).toISOString(),
                    });

                    certificateAutomation = {
                        eligible: true,
                        issued: true,
                        emailSent,
                        message:
                            "Certificate auto-issued because score is 80+",
                    };
                } catch (autoIssueError: any) {
                    certificateAutomation = {
                        eligible: true,
                        issued: false,
                        emailSent: false,
                        message: `Auto-issue failed: ${autoIssueError.message || autoIssueError}`,
                    };
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Student exam score updated successfully",
            data: updatedStudent,
            certificateAutomation,
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

        const existingStudent = await getStudentByEmailAndTeacher(
            email,
            teacher.id,
        );

        if (existingStudent) {
            return res.status(201).json({
                success: true,
                full_name: existingStudent.full_name,
                email: existingStudent.email,
                student_id: existingStudent.id,
                teacher_id: teacher.id,
                teacer_wallet: teacher.wallet_address,
                message: "Student already exists for this teacher",
            });
        }

        const student = await createStudent({
            full_name: String(name),
            email: String(email),
            created_by: teacher.id,
        });

        return res.status(201).json({
            success: true,
            teacher_wallet: teacher.wallet_address,
            teacher_id: teacher.id,
            student_id: student.id,
            student_full_name: student.full_name,
            student_email: student.email,
            message: "Student joined successfully",
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
