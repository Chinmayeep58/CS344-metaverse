import pool from "../config/db";

// TypeScript interfaces
export interface Student {
    id: number;
    full_name: string;
    email?: string;
    exam_score?: number;
    created_by?: number;
    created_at: Date;
    updated_at: Date;
}

export interface CreateStudentInput {
    full_name: string;
    email?: string;
    exam_score?: number;
    created_by?: number;
}

// Create table query
export const createTableQuery = `
  CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    exam_score INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Drop table query
export const dropTableQuery = `
  DROP TABLE IF EXISTS students CASCADE;
`;

// Create indexes query
export const createIndexesQuery = `
  CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
  CREATE INDEX IF NOT EXISTS idx_students_created_by ON students(created_by);
`;

// Create student
export const createStudent = async (
    studentData: CreateStudentInput,
): Promise<Student> => {
    const { full_name, email, exam_score, created_by } = studentData;
    const query = `
    INSERT INTO students (full_name, email, exam_score, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
    const values = [full_name, email, exam_score, created_by];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// Get student by ID
export const getStudentById = async (
    id: number,
): Promise<Student | undefined> => {
    const query = `
    SELECT * FROM students WHERE id = $1;
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// Get all students by teacher (created_by)
export const getAllStudentsByTeacher = async (
    teacherId: number,
): Promise<Student[]> => {
    const query = `
    SELECT * FROM students WHERE created_by = $1 ORDER BY created_at DESC;
  `;
    const result = await pool.query(query, [teacherId]);
    return result.rows;
};
