import type { Request, Response } from "express";
import {
    createStudent,
    getStudentById,
    getAllStudentsByTeacher,
    getStudentByEmailAndTeacher,
    updateStudentExamScore,
} from "../models/Student.model";
import { getUserByTeacherCode } from "../models/User.model";

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const updateStudentScore = async (req: Request, res: Response) => {
    try {
        const { student_id, exam_score } = req.body;
        const userId = (req as any).user?.id;

        if (!student_id || exam_score === undefined) {
            return res.status(400).json({
                success: false,
                message: "student_id and exam_score are required",
            });
        }

        if (!Number.isFinite(Number(exam_score))) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam_score",
            });
        }

        const parsedScore = Number(exam_score);
        if (parsedScore < 0 || parsedScore > 100) {
            return res.status(400).json({
                success: false,
                message: "exam_score must be between 0 and 100",
            });
        }

        const student = await getStudentById(Number(student_id));

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        if (!userId || Number(student.created_by) !== Number(userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this student",
            });
        }

        const updatedStudent = await updateStudentExamScore(
            Number(student_id),
            parsedScore,
        );

        return res.status(200).json({
            success: true,
            message: "Student exam score updated successfully",
            data: updatedStudent,
        });
    } catch (error: any) {
        console.error("Error updating student exam score:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update student exam score",
            error: error.message || "Internal server error",
        });
    }
};

export const joinStudentWithTeacherCode = async (
    req: Request,
    res: Response,
) => {
    try {
        const { teacher_code, name, email } = req.body;

        if (!teacher_code || !name || !email) {
            return res.status(400).json({
                success: false,
                message: "teacher_code, name and email are required",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        const teacher = await getUserByTeacherCode(String(teacher_code));

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Invalid teacher_code",
            });
        }

        const existingStudent = await getStudentByEmailAndTeacher(
            email,
            teacher.id,
        );

        if (existingStudent) {
            return res.status(201).json({
                success: true,
                full_name: existingStudent.full_name,
                email: existingStudent.email,
                student_id: existingStudent.id,
                teacher_id: teacher.id,
                teacer_wallet: teacher.wallet_address,
                message: "Student already exists for this teacher",
            });
        }

        const student = await createStudent({
            full_name: String(name),
            email: String(email),
            created_by: teacher.id,
        });

        return res.status(201).json({
            success: true,
            teacher_wallet: teacher.wallet_address,
            teacher_id: teacher.id,
            student_id: student.id,
            student_full_name: student.full_name,
            student_email: student.email,
            message: "Student joined successfully",
        });
    } catch (error: any) {
        if (error?.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Student email already exists for this teacher",
            });
        }

        console.error("Error joining student:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to join student",
            error: error.message || "Internal server error",
        });
    }
};

export const getStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const student = await getStudentById(Number(id));

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: student,
        });
    } catch (error: any) {
        console.error("Error fetching student:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch student",
            error: error.message || "Internal server error",
        });
    }
};

export const getTeacherStudents = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const students = await getAllStudentsByTeacher(userId);

        return res.status(200).json({
            success: true,
            data: students,
        });
    } catch (error: any) {
        console.error("Error fetching students:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch students",
            error: error.message || "Internal server error",
        });
    }
};
