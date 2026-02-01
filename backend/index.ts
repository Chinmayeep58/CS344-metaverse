import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { runMigrations } from "./migrations/init";
import authRoutes from "./routes/auth.routes";
dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Metaverse Backend is running.");
});

// Auth routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await connectDB().catch((err) => {
        console.error("Failed to connect to the database on startup:", err);
    });
    await runMigrations().catch((err) => {
        console.error("Failed to run migrations on startup:", err);
    });

    console.log(`Server is running on port ${PORT}`);
});
