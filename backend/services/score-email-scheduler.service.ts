import {
    getStudentsWithPendingScoreEmail,
    getEligibleStudentsWithoutCertificate,
    updateStudentScoreEmailStatus,
} from "../models/Student.model";
import { sendStudentScoreUpdatedEmail, sendCertificateIssuedEmail } from "./mail.service";
import { uploadMetadataToIPFS } from "./ipfs.service";
import { issueCertificateOnChain } from "./blockchain.service";
import { createCertificate, getCertificatesByStudent } from "../models/Certificate.model";

const buildCertificateMetadata = (student: any) => ({
    name: `VR Disaster Training Certificate - ${student.full_name}`,
    description: `This certificate confirms that ${student.full_name} has successfully completed the VR Disaster Training program with a score of ${student.exam_score}.`,
    image: "ipfs://QmYourDefaultImageHash",
    attributes: [
        { trait_type: "Student Name", value: student.full_name },
        { trait_type: "Email", value: student.email },
        { trait_type: "Exam Score", value: student.exam_score },
        { trait_type: "Completion Date", value: new Date().toISOString() },
        { trait_type: "Status", value: student.exam_score >= 90 ? "Excellent" : "Pass" },
    ],
});

export const runPendingScoreEmailCron = async () => {
    try {
        const students = await getStudentsWithPendingScoreEmail();
        if (students.length === 0) {
            console.log("[ScoreEmailScheduler] No pending score emails to send.");
            return;
        }

        console.log(
            `[ScoreEmailScheduler] Found ${students.length} students with pending score email`,
        );

        for (const student of students) {
            if (!student.email || student.exam_score === undefined || student.exam_score === null) {
                continue;
            }

            try {
                const emailSent = await sendStudentScoreUpdatedEmail({
                    recipientEmail: student.email,
                    studentName: student.full_name,
                    examScore: student.exam_score,
                });

                await updateStudentScoreEmailStatus(student.id, emailSent);

                console.log(
                    `[ScoreEmailScheduler] ${emailSent ? "Sent" : "Failed to send"} score email for student ${student.id} (${student.email})`,
                );
            } catch (error: any) {
                console.error(
                    `[ScoreEmailScheduler] Error processing student ${student.id}:`,
                    error?.message || error,
                );
            }
        }

        // Try issuing and sending certificates for eligible students without certificates
        console.log("[ScoreEmailScheduler] Checking for certificate eligibility...");
        const eligibleStudents = await getEligibleStudentsWithoutCertificate();
        console.log(`[ScoreEmailScheduler] getEligibleStudentsWithoutCertificate returned ${eligibleStudents.length} students`);

        if (eligibleStudents.length === 0) {
            console.log("[ScoreEmailScheduler] No eligible students for certificates.");
        } else {
            console.log(
                `[ScoreEmailScheduler] Found ${eligibleStudents.length} eligible students for certificates`,
            );
            console.log("[ScoreEmailScheduler] Eligible student IDs:", eligibleStudents.map(s => s.id));
        }

        for (const student of eligibleStudents) {
            console.log(`[ScoreEmailScheduler] Processing certificate for student ${student.id} (${student.full_name})`);
            if (!student.email || student.exam_score === undefined || student.exam_score === null) {
                console.log(`[ScoreEmailScheduler] Skipping student ${student.id} - missing email or score`);
                continue;
            }

            try {
                const existingCertificates = await getCertificatesByStudent(student.id);
                if (existingCertificates.length > 0) {
                    console.log(`[ScoreEmailScheduler] Student ${student.id} already has ${existingCertificates.length} certificates, skipping`);
                    continue; // already has one (safety)
                }

                console.log(`[ScoreEmailScheduler] Issuing certificate for student ${student.id}...`);
                const metadata = buildCertificateMetadata(student);
                console.log(`[ScoreEmailScheduler] Uploading metadata to IPFS for student ${student.id}...`);
                const ipfsHash = await uploadMetadataToIPFS(metadata);
                console.log(`[ScoreEmailScheduler] IPFS upload successful for student ${student.id}, hash: ${ipfsHash}`);

                console.log(`[ScoreEmailScheduler] Issuing certificate on blockchain for student ${student.id}...`);
                const { tokenId, txHash } = await issueCertificateOnChain(
                    student.full_name,
                    student.email,
                    student.exam_score,
                    ipfsHash,
                );
                console.log(`[ScoreEmailScheduler] Blockchain transaction successful for student ${student.id}, tokenId: ${tokenId}, txHash: ${txHash}`);

                const teacherId = Number(student.created_by || 0);
                console.log(`[ScoreEmailScheduler] Creating certificate record in database for student ${student.id}...`);
                const certificate = await createCertificate({
                    student_id: student.id,
                    token_id: tokenId,
                    tx_hash: txHash,
                    ipfs_hash: ipfsHash,
                    issued_by: teacherId,
                });
                console.log(`[ScoreEmailScheduler] Certificate record created for student ${student.id}, cert ID: ${certificate.id}`);

                let certEmailSent = false;
                try {
                    certEmailSent = await sendCertificateIssuedEmail({
                        recipientEmail: student.email,
                        studentName: student.full_name,
                        examScore: student.exam_score,
                        tokenId,
                        txHash,
                        ipfsHash,
                        issueDate: new Date(certificate.issued_at).toISOString(),
                    });
                } catch (emailErr: any) {
                    console.error(
                        `[ScoreEmailScheduler] Certificate issued but email failed for student ${student.id}:`,
                        emailErr?.message || emailErr,
                    );
                }

                console.log(
                    `[ScoreEmailScheduler] Certificate ` +
                        `${certEmailSent ? "sent" : "created"} for student ${student.id}`,
                );
            } catch (error: any) {
                console.error(
                    `[ScoreEmailScheduler] Error issuing certificate for student ${student.id}:`,
                    error?.message || error,
                );
            }
        }
    } catch (error: any) {
        console.error(
            "[ScoreEmailScheduler] Failed to query pending students:",
            error?.message || error,
        );
    }
};
