import pool from "../config/db";
import {
    createUsersTable,
    createUserIndexes,
    ensureTeacherCodeColumnQuery,
} from "../models/User.model";
import {
    createTableQuery as createStudentsTable,
    createIndexesQuery as createStudentIndexes,
} from "../models/Student.model";
import {
    createTableQuery as createCertificatesTable,
    createIndexesQuery as createCertificateIndexes,
} from "../models/Certificate.model";

export const runMigrations = async () => {
    try {
        console.log("Running migrations...");

        // Create users table and indexes
        await pool.query(createUsersTable);
        await pool.query(ensureTeacherCodeColumnQuery);
        await pool.query(createUserIndexes);
        console.log("✓ Users table created");

        // Create students table and indexes
        await pool.query(createStudentsTable);
        await pool.query(createStudentIndexes);
        // Add score_email_sent column if missing (for existing databases)
        await pool.query(
            "ALTER TABLE students ADD COLUMN IF NOT EXISTS score_email_sent BOOLEAN DEFAULT FALSE;",
        );
        console.log("✓ Students table created");

        // Create certificates table and indexes
        await pool.query(createCertificatesTable);
        await pool.query(createCertificateIndexes);
        console.log("✓ Certificates table created");

        console.log("All migrations completed successfully");
    } catch (error) {
        console.error("Error running migrations:", error);
        throw error;
    }
};
