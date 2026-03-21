import nodemailer from "nodemailer";
import sharp from "sharp";

interface CertificateEmailInput {
    recipientEmail: string;
    studentName: string;
    examScore: number;
    tokenId: number;
    txHash: string;
    ipfsHash: string;
    issueDate?: string;
}

const escapeXml = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const buildCertificateSvg = (input: CertificateEmailInput): string => {
    const issuedOn = input.issueDate
        ? new Date(input.issueDate).toLocaleString()
        : new Date().toLocaleString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1120" viewBox="0 0 1600 1120">
    <rect width="100%" height="100%" fill="#f8fafc" />
    <rect x="40" y="40" width="1520" height="1040" rx="24" ry="24" fill="#ffffff" stroke="#fcd34d" stroke-width="12" />
    <rect x="90" y="90" width="1420" height="940" rx="14" ry="14" fill="#ffffff" stroke="#f59e0b" stroke-width="5" />

    <text x="800" y="160" text-anchor="middle" fill="#b45309" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" letter-spacing="5">
        EMERGENCY PREPAREDNESS PROGRAM
    </text>
    <text x="800" y="245" text-anchor="middle" fill="#1f2937" font-family="Georgia, 'Times New Roman', serif" font-size="70" font-weight="800">
        Certificate of Completion
    </text>
    <text x="800" y="320" text-anchor="middle" fill="#334155" font-family="Georgia, 'Times New Roman', serif" font-size="32">
        This certifies that
    </text>
    <text x="800" y="405" text-anchor="middle" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="800">
        ${escapeXml(input.studentName)}
    </text>
    <text x="800" y="448" text-anchor="middle" fill="#475569" font-family="Georgia, 'Times New Roman', serif" font-size="24">
        ${escapeXml(input.recipientEmail)}
    </text>

    <text x="800" y="470" text-anchor="middle" fill="#334155" font-family="Georgia, 'Times New Roman', serif" font-size="30">
        has successfully completed the Earthquake Training Simulation
    </text>
    <text x="800" y="515" text-anchor="middle" fill="#334155" font-family="Georgia, 'Times New Roman', serif" font-size="30">
        and demonstrated readiness with score
    </text>
    <rect x="730" y="540" width="140" height="54" rx="8" ry="8" fill="#dcfce7" />
    <text x="800" y="577" text-anchor="middle" fill="#166534" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700">
        ${input.examScore}
    </text>

    <rect x="180" y="680" width="1240" height="220" rx="12" ry="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
    <text x="230" y="740" fill="#475569" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">Simulation ID</text>
    <text x="1320" y="740" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="28">EQ-${input.tokenId}</text>

    <text x="230" y="800" fill="#475569" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">Student Email</text>
    <text x="1320" y="800" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="28">${escapeXml(input.recipientEmail)}</text>

    <text x="230" y="860" fill="#475569" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">Issue Date</text>
    <text x="1320" y="860" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="28">${escapeXml(issuedOn)}</text>

    <text x="180" y="975" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="700">Earthquake Response Training Division</text>
    <text x="1420" y="975" text-anchor="end" fill="#0f172a" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="800">EQRT-${String(input.tokenId).padStart(5, "0")}</text>
</svg>`;
};

const parseBoolean = (value?: string): boolean => {
    return String(value).toLowerCase() === "true";
};

const isMailConfigured = (): boolean => {
    return Boolean(
        process.env.SMTP_HOST &&
            process.env.SMTP_PORT &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS,
    );
};

const createTransporter = () => {
    const port = Number(process.env.SMTP_PORT);

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: parseBoolean(process.env.SMTP_SECURE) || port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

export const sendCertificateIssuedEmail = async (
    input: CertificateEmailInput,
): Promise<boolean> => {
    if (!isMailConfigured()) {
        console.warn(
            "Email not sent: SMTP configuration is missing (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS).",
        );
        return false;
    }

    const transporter = createTransporter();
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
    const certificateLink = `https://gateway.pinata.cloud/ipfs/${input.ipfsHash}`;
    const certificateSvg = buildCertificateSvg(input);
    const certificatePng = await sharp(Buffer.from(certificateSvg)).png().toBuffer();
    const inlineCertificateCid = `certificate-${input.tokenId}@metaverse`;

    await transporter.sendMail({
        from: fromAddress,
        to: input.recipientEmail,
        subject: "Your VR Disaster Training Certificate",
        text: [
            `Hello ${input.studentName},`,
            "",
            "Congratulations! Your VR Disaster Training Certificate has been issued.",
            "",
            `Score: ${input.examScore}`,
            `Student Email: ${input.recipientEmail}`,
            `Token ID: ${input.tokenId}`,
            `Transaction Hash: ${input.txHash}`,
            `Certificate Metadata: ${certificateLink}`,
            "",
            "Your certificate file is attached in this email.",
            "",
            "You can use your Token ID and transaction hash to verify authenticity anytime.",
        ].join("\n"),
        html: `
            <p>Hello <strong>${input.studentName}</strong>,</p>
            <p>Congratulations! Your VR Disaster Training Certificate has been issued.</p>
            <ul>
                <li><strong>Score:</strong> ${input.examScore}</li>
                <li><strong>Student Email:</strong> ${input.recipientEmail}</li>
                <li><strong>Token ID:</strong> ${input.tokenId}</li>
                <li><strong>Transaction Hash:</strong> ${input.txHash}</li>
            </ul>
            <p><strong>Certificate:</strong></p>
            <p><img src="cid:${inlineCertificateCid}" alt="Certificate" style="max-width:100%; height:auto; border:1px solid #e5e7eb; border-radius:8px;" /></p>
            <p>Your certificate file is attached to this email.</p>
            <p><a href="${certificateLink}">View Certificate Metadata (IPFS)</a></p>
            <p>You can use your Token ID and transaction hash to verify authenticity anytime.</p>
        `,
        attachments: [
            {
                filename: `certificate-${input.tokenId}.png`,
                content: certificatePng,
                contentType: "image/png",
                cid: inlineCertificateCid,
            },
        ],
    });

    return true;
};
