import type { Request, Response } from "express";
import {
    createStudent,
    getStudentById,
    getAllStudentsByTeacher,
} from "../models/Student.model";

export const createNewStudent = async (req: Request, res: Response) => {
    try {
        const { full_name, email, exam_score } = req.body;
        const userId = (req as any).user?.id;

        if (!full_name) {
            return res.status(400).json({
                success: false,
                message: "Full name is required",
            });
        }

        const student = await createStudent({
            full_name,
            email,
            exam_score,
            created_by: userId,
        });

        return res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: student,
        });
    } catch (error: any) {
        console.error("Error creating student:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create student",
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
