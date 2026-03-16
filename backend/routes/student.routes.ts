import { Router } from "express";
import {
    getStudent,
    getTeacherStudents,
    joinStudentWithTeacherCode,
    updateStudentScore,
} from "../controllers/student.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Public route - student joins with teacher code
router.post("/join", joinStudentWithTeacherCode);

// All routes require authentication
router.post("/update-score", authenticateToken, updateStudentScore);
router.get("/my-students", authenticateToken, getTeacherStudents);
router.get("/get-student/:id", authenticateToken, getStudent);

export default router;
