import pool from "../config/db";

export const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,

        -- identity
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,

        -- metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );  
`;

export const createUserIndexes = `
    CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;


export const dropUsersTable = `
    DROP TABLE IF EXISTS users;
`;


export const createUser = async (walletAddress: string, email: string, fullName: string, passwordHash: string) => {
    const query = `
        INSERT INTO users (wallet_address, email, full_name, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [walletAddress, email, fullName, passwordHash];
    const res = await pool.query(query, values);
    return res.rows[0];
};

export const loginUser = async (email: string, wallet_address: string, passwordHash: string) => {
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
        SELECT * FROM users WHERE email = $1;
    `;
    const values = [email];
    const res = await pool.query(query, values);
    return res.rows[0];
};

