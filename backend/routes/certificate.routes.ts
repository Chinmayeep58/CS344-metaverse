import { Router } from "express";
import {
    issueCertificate,
    getCertificateByToken,
    getCertificatesByStudentId,
    revokeCertificateById,
    verifyCertificate,
} from "../controllers/certificate.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Protected routes - require authentication
router.post("/issue", authenticateToken, issueCertificate);
router.get(
    "/student/:studentId",
    authenticateToken,
    getCertificatesByStudentId,
);
router.put("/:certificateId/revoke", authenticateToken, revokeCertificateById);

// Public routes - anyone can verify or view certificates
router.get("/token/:tokenId", getCertificateByToken);
router.get("/verify/:tokenId", verifyCertificate);

export default router;
