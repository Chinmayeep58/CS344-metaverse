import { Router } from "express";
import {
    getStudent,
    getTeacherStudents,
    joinStudentWithTeacherCode,
    updateStudentScore,
    verifyStudentEmailAddress,
    getActiveStudentSession,
    closeStudentSession,
} from "../controllers/student.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Public route - student joins with teacher code
router.post("/join", joinStudentWithTeacherCode);
router.post("/verify-email", verifyStudentEmailAddress);

// changed: no :sessionId, single active session only
router.get("/session/active", getActiveStudentSession);
router.post("/session/close", closeStudentSession);

// All routes require authentication
router.post("/update-score", authenticateToken, updateStudentScore);
router.get("/my-students", authenticateToken, getTeacherStudents);
router.get("/get-student/:id", authenticateToken, getStudent);

export default router;
