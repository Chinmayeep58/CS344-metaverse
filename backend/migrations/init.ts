import pool from "../config/db";
import { createUserIndexes, createUsersTable } from "../models/User.model";

export const runMigrations = async () => {
    const client = await pool.connect();
    try {
        console.log("Running initial migrations...");

        await pool.query(createUsersTable);
        await pool.query(createUserIndexes);

        console.log("Migrations completed.");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
};
