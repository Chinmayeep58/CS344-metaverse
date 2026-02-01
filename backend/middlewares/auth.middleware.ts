import { verifyToken } from "../utils/jwt.util";
import { getUserByEmail } from "../models/User.model";

export const authenticateToken = async (
    req: any,
    res: any,
    next: any,
): Promise<void> => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ message: "Access token is required" });
            return;
        }

        // Verify token
        const decoded = verifyToken(token);

        // Get user from database
        const user = await getUserByEmail(decoded.email);
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        // Attach user to request
        (req as any).user = user;
        next();
    } catch (error: any) {
        console.error("Authentication error:", error);
        res.status(403).json({ message: "Invalid or expired token" });
    }
};
