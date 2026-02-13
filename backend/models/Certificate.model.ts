import pool from "../config/db";

// TypeScript interfaces
export interface Certificate {
    id: number;
    student_id: number;
    token_id: number;
    tx_hash: string;
    ipfs_hash: string;
    issued_by: number;
    revoked: boolean;
    issued_at: Date;
}

export interface CreateCertificateInput {
    student_id: number;
    token_id: number;
    tx_hash: string;
    ipfs_hash: string;
    issued_by: number;
}

// Create table query
export const createTableQuery = `
  CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    token_id INTEGER NOT NULL,
    tx_hash VARCHAR(255) NOT NULL,
    ipfs_hash TEXT NOT NULL,
    issued_by INTEGER REFERENCES users(id),
    revoked BOOLEAN DEFAULT false,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Drop table query
export const dropTableQuery = `
  DROP TABLE IF EXISTS certificates CASCADE;
`;

// Create indexes query
export const createIndexesQuery = `
  CREATE INDEX IF NOT EXISTS idx_certificates_token_id ON certificates(token_id);
  CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
  CREATE INDEX IF NOT EXISTS idx_certificates_tx_hash ON certificates(tx_hash);
`;

// Create certificate
export const createCertificate = async (
    certificateData: CreateCertificateInput,
): Promise<Certificate> => {
    const { student_id, token_id, tx_hash, ipfs_hash, issued_by } =
        certificateData;
    const query = `
    INSERT INTO certificates (student_id, token_id, tx_hash, ipfs_hash, issued_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
    const values = [student_id, token_id, tx_hash, ipfs_hash, issued_by];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// Get certificate by token ID
export const getCertificateByTokenId = async (
    token_id: number,
): Promise<Certificate | undefined> => {
    const query = `
    SELECT * FROM certificates WHERE token_id = $1;
  `;
    const result = await pool.query(query, [token_id]);
    return result.rows[0];
};

// Get all certificates by student
export const getCertificatesByStudent = async (
    student_id: number,
): Promise<Certificate[]> => {
    const query = `
    SELECT * FROM certificates WHERE student_id = $1 ORDER BY issued_at DESC;
  `;
    const result = await pool.query(query, [student_id]);
    return result.rows;
};

// Revoke certificate
export const revokeCertificate = async (
    id: number,
): Promise<Certificate | undefined> => {
    const query = `
    UPDATE certificates 
    SET revoked = true 
    WHERE id = $1 
    RETURNING *;
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};
