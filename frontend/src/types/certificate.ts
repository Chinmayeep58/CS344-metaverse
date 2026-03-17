export interface Certificate {
    id: number;
    student_id: number;
    token_id: number;
    tx_hash: string;
    ipfs_hash: string;
    issued_by: number;
    revoked: boolean;
    issued_at: string;
}

export interface CertificateRow extends Certificate {
    studentName: string;
    examScore: number | "N/A";
    studentEmail: string;
}
