import { ethers } from "ethers";
import contractArtifact from "../../blockchain/artifacts/contracts/DistasterCertificate.sol/DisasterCertificate.json";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
    throw new Error(
        "Missing required environment variables: SEPOLIA_RPC_URL, PRIVATE_KEY, or CONTRACT_ADDRESS",
    );
}

const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    contractArtifact.abi,
    wallet,
) as any;

interface IssueCertificateResult {
    tokenId: number;
    txHash: string;
}

interface VerifyCertificateResult {
    isValid: boolean;
    certificate: {
        tokenId: number;
        studentName: string;
        studentEmail: string;
        examScore: number;
        issueDate: number;
        ipfsHash: string;
        issuedBy: string;
        revoked: boolean;
    };
}


export const issueCertificateOnChain = async (
    studentName: string,
    studentEmail: string,
    examScore: number,
    ipfsHash: string,
): Promise<IssueCertificateResult> => {
    try {
        const tx = await contract.issueCertificate(
            studentName,
            studentEmail,
            examScore,
            ipfsHash,
        );

        const receipt = await tx.wait();

        let tokenId: number | null = null;

        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog({
                    topics: [...log.topics],
                    data: log.data,
                });

                if (parsedLog && parsedLog.name === "CertificateIssued") {
                    tokenId = Number(parsedLog.args[0]);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (tokenId === null) {
            throw new Error("CertificateIssued event not found in transaction");
        }

        return {
            tokenId,
            txHash: receipt.hash,
        };
    } catch (error: any) {
        console.error("Error issuing certificate on chain:", error);
        throw new Error(
            `Failed to issue certificate: ${error.message || error}`,
        );
    }
};


export const revokeCertificateOnChain = async (
    tokenId: number,
): Promise<string> => {
    try {
        const tx = await contract.revokeCertificate(tokenId);

        const receipt = await tx.wait();

        return receipt.hash;
    } catch (error: any) {
        console.error("Error revoking certificate on chain:", error);
        throw new Error(
            `Failed to revoke certificate: ${error.message || error}`,
        );
    }
};

export const verifyCertificateOnChain = async (
    tokenId: number,
): Promise<VerifyCertificateResult> => {
    try {
        const result = await contract.verifyCertificate(tokenId);

        return {
            isValid: result.isValid,
            certificate: {
                tokenId: Number(result.cert.tokenId),
                studentName: result.cert.studentName,
                studentEmail: result.cert.studentEmail,
                examScore: Number(result.cert.examScore),
                issueDate: Number(result.cert.issueDate),
                ipfsHash: result.cert.ipfsHash,
                issuedBy: result.cert.issuedBy,
                revoked: result.cert.revoked,
            },
        };
    } catch (error: any) {
        console.error("Error verifying certificate on chain:", error);
        throw new Error(
            `Failed to verify certificate: ${error.message || error}`,
        );
    }
};


export const getCertificateDetails = async (tokenId: number) => {
    try {
        const cert = await contract.getCertificate(tokenId);

        return {
            tokenId: Number(cert.tokenId),
            studentName: cert.studentName,
            studentEmail: cert.studentEmail,
            examScore: Number(cert.examScore),
            issueDate: Number(cert.issueDate),
            ipfsHash: cert.ipfsHash,
            issuedBy: cert.issuedBy,
            revoked: cert.revoked,
        };
    } catch (error: any) {
        console.error("Error getting certificate details:", error);
        throw new Error(
            `Failed to get certificate details: ${error.message || error}`,
        );
    }
};


export const getTotalCertificatesIssued = async (): Promise<number> => {
    try {
        const total = await contract.totalCertificatesIssued();
        return Number(total);
    } catch (error: any) {
        console.error("Error getting total certificates:", error);
        throw new Error(
            `Failed to get total certificates: ${error.message || error}`,
        );
    }
};

export default {
    issueCertificateOnChain,
    revokeCertificateOnChain,
    verifyCertificateOnChain,
    getCertificateDetails,
    getTotalCertificatesIssued,
};
