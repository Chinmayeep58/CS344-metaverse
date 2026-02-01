import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";

const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
    (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "1d";

export interface JWTPayload {
    userId: number;
    email: string;
    walletAddress: string;
}

export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

export const verifyToken = (token: string): JWTPayload => {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
