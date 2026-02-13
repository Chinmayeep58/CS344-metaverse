import { createUser, getUserByEmail } from "../models/User.model";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateToken } from "../utils/jwt.util";

export const signup = async (req: any, res: any): Promise<void> => {
    try {
        const { walletAddress, email, fullName, password } = req.body;

        if (!walletAddress || !email || !fullName || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            res.status(409).json({ message: "User already exists" });
            return;
        }

        const passwordHash = await hashPassword(password);
        const user = await createUser(
            walletAddress,
            email,
            fullName,
            passwordHash,
        );
        const token = generateToken({
            userId: user.id,
            email: user.email,
            walletAddress: user.wallet_address,
        });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                walletAddress: user.wallet_address,
            },
        });
    } catch (error: any) {
        console.error("Signup error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const login = async (req: any, res: any): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                message: "Email and password are required",
            });
            return;
        }

        const user = await getUserByEmail(email);
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const isPasswordValid = await comparePassword(
            password,
            user.password_hash,
        );
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const token = generateToken({
            userId: user.id,
            email: user.email,
            walletAddress: user.wallet_address,
        });

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                walletAddress: user.wallet_address,
            },
        });
    } catch (error: any) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const getProfile = async (req: any, res: any): Promise<void> => {
    try {
        const user = (req as any).user;

        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                walletAddress: user.wallet_address,
            },
        });
    } catch (error: any) {
        console.error("Get profile error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
