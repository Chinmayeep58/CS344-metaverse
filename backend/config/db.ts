import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10,
    query_timeout: 5000,
});

export const connectDB = async () => {
    try {
        console.log("Attempting to connect to database...");
        console.log("DB_HOST:", process.env.DB_HOST);
        console.log("DB_PORT:", process.env.DB_PORT);
        console.log("DB_USER:", process.env.DB_USER);
        console.log("DB_NAME:", process.env.DB_NAME);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error("Database connection timeout")),
                5000,
            ),
        );

        const queryPromise = pool.query("SELECT NOW()");
        const res = (await Promise.race([queryPromise, timeoutPromise])) as any;

        console.log("Connected to DB:", res.rows[0]);
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error);
        // Don't throw - let the server continue running
    }
};

export default pool;
