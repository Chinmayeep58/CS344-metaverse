import pool from "../config/db";
import { generateTeacherCode } from "../utils/teacherCode.util";

export const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,

        -- identity
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        teacher_code VARCHAR(20) UNIQUE,
        password_hash TEXT NOT NULL,

        -- metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );  
`;

export const createUserIndexes = `
    CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_teacher_code ON users(teacher_code);
`;

export const ensureTeacherCodeColumnQuery = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS teacher_code VARCHAR(20) UNIQUE;
`;

export const dropUsersTable = `
    DROP TABLE IF EXISTS users;
`;

const generateUniqueTeacherCode = async (): Promise<string> => {
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateTeacherCode();
        const existing = await getUserByTeacherCode(code);

        if (!existing) {
            return code;
        }
    }

    throw new Error("Unable to generate a unique teacher code");
};

export const createUser = async (
    walletAddress: string,
    email: string,
    fullName: string,
    passwordHash: string,
) => {
    const teacherCode = await generateUniqueTeacherCode();

    const query = `
        INSERT INTO users (wallet_address, email, full_name, teacher_code, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [walletAddress, email, fullName, teacherCode, passwordHash];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const loginUser = async (
    email: string,
    wallet_address: string,
    passwordHash: string,
) => {
    const query = `
        SELECT * FROM users
        WHERE email = $1 AND wallet_address = $2 AND password_hash = $3;
    `;
    const values = [email, wallet_address, passwordHash];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const getUserByEmail = async (email: string) => {
    const query = `
        SELECT * FROM users WHERE LOWER(email) = LOWER($1);
    `;
    const values = [email.trim()];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const getUserByTeacherCode = async (teacherCode: string) => {
    const query = `
        SELECT * FROM users WHERE teacher_code = $1;
    `;
    const values = [teacherCode];
    const res = await pool.query(query, values);
    return res.rows[0];
};
