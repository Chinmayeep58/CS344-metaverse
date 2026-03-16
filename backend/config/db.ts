import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "22360"),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false,
    },
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log("✓ PostgreSQL connected successfully");
        client.release();
    } catch (error) {
        console.error("✗ PostgreSQL connection error:", error);
        throw error;
    }
};

export default pool;
