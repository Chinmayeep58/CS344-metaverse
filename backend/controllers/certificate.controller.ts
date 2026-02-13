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

export const issueCertificate = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.body;
        const userId = (req as any).user?.id;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
            });
        }

        const student = await getStudentById(studentId);

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

        if (student.exam_score < 70) {
            return res.status(400).json({
                success: false,
                message: "Student exam score must be at least 70",
            });
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
            student_id: studentId,
            token_id: tokenId,
            tx_hash: txHash,
            ipfs_hash: ipfsHash,
            issued_by: userId || student.created_by || 1,
        });

        return res.status(201).json({
            success: true,
            message: "Certificate issued successfully",
            data: {
                tokenId,
                txHash,
                ipfsHash,
                certificate,
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
