import { Router } from "express";
import {
    createNewStudent,
    getStudent,
    getTeacherStudents,
} from "../controllers/student.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.post("/", authenticateToken, createNewStudent);
router.get("/my-students", authenticateToken, getTeacherStudents);
router.get("/:id", authenticateToken, getStudent);

export default router;
