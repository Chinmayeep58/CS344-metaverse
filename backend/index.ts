import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { runMigrations } from "./migrations/init";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import certificateRoutes from "./routes/certificate.routes";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "Metaverse Backend API is running",
        version: "1.0.0",
        status: "healthy",
    });
});

app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/certificates", certificateRoutes);

app.use(
    (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        console.error("Error:", err);
        res.status(err.status || 500).json({
            success: false,
            message: err.message || "Internal server error",
            error: process.env.NODE_ENV === "development" ? err : {},
        });
    },
);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log("Database connected");

        await runMigrations();
        console.log("Migrations completed");
        console.log(`Server is running on port ${PORT}`);
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
});

export default app;
