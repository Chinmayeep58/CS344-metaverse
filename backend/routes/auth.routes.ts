import { Router } from "express";
import { signup, login, getProfile } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticateToken, getProfile);

export default router;
