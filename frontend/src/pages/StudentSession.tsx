import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
    joinStudentSession,
    type JoinSessionResponse,
} from "@/api/student-session.api";
import api from "@/api/axios";

type ActiveSessionResponse = {
    success: boolean;
    message?: string;
    data?: {
        sessionId: string;
        studentId: number;
        teacherId: number;
        teacherCode: string;
        studentName: string;
        studentEmail: string;
        status: "active" | "closed";
        startedAt: string;
        endedAt: string | null;
    };
};

type CloseSessionResponse = {
    success: boolean;
    message?: string;
    scoreUpdated?: boolean;
    data?: ActiveSessionResponse["data"];
};

function StudentSession() {
    const { toast } = useToast();
    const [teacherCode, setTeacherCode] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<JoinSessionResponse | null>(null);

    const [examScore, setExamScore] = useState("");
    const [activeResult, setActiveResult] =
        useState<ActiveSessionResponse | null>(null);
    const [closeResult, setCloseResult] = useState<CloseSessionResponse | null>(
        null,
    );
    const [checkingActive, setCheckingActive] = useState(false);
    const [closingSession, setClosingSession] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);
        setActiveResult(null);
        setCloseResult(null);
        setLoading(true);

        try {
            const data = await joinStudentSession({
                teacher_code: teacherCode.trim(),
                name: name.trim(),
                email: email.trim(),
            });

            if (!data.success) {
                throw new Error(data.message || "Failed to create session");
            }

            setResult(data);
            toast({
                title: "Session created",
                description: data.message || "Student session is active",
            });
        } catch (error: any) {
            toast({
                title: "Session creation failed",
                description:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Please verify details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const onCheckActive = async () => {
        setCheckingActive(true);
        setActiveResult(null);

        try {
            const res = await api.get<ActiveSessionResponse>(
                `/students/session/active`,
            );
            setActiveResult(res.data);
            toast({
                title: "Active session fetched",
                description: "Current active session loaded.",
            });
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch active session";
            setActiveResult({ success: false, message: msg });
            toast({
                title: "Check failed",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setCheckingActive(false);
        }
    };

    const onCloseSession = async () => {
        const scoreValue =
            examScore.trim() === "" ? undefined : Number(examScore.trim());

        if (
            scoreValue !== undefined &&
            (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 100)
        ) {
            toast({
                title: "Invalid exam score",
                description: "exam_score must be between 0 and 100.",
                variant: "destructive",
            });
            return;
        }

        setClosingSession(true);
        setCloseResult(null);

        try {
            const res = await api.post<CloseSessionResponse>(
                `/students/session/close`,
                scoreValue === undefined ? {} : { exam_score: scoreValue },
            );
            setCloseResult(res.data);
            toast({
                title: "Active session closed",
                description:
                    res.data.message || "Current session deleted/closed.",
            });
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to close session";
            setCloseResult({ success: false, message: msg });
            toast({
                title: "Close failed",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setClosingSession(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Student Session</CardTitle>
                    <CardDescription>
                        Enter teacher code, name, and email to start training
                        session.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="teacherCode">Teacher Code</Label>
                            <Input
                                id="teacherCode"
                                value={teacherCode}
                                onChange={(e) => setTeacherCode(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="studentName">Student Name</Label>
                            <Input
                                id="studentName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="studentEmail">Student Email</Label>
                            <Input
                                id="studentEmail"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Creating session..." : "Create Session"}
                        </Button>
                    </form>

                    {result?.session ? (
                        <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">
                            <p className="font-medium">
                                {result.message || "Session active"}
                            </p>
                            <p>
                                <strong>Session ID:</strong>{" "}
                                {result.session.session_id}
                            </p>
                            <p>
                                <strong>Status:</strong> {result.session.status}
                            </p>
                            <p>
                                <strong>Reused:</strong>{" "}
                                {result.session.reused ? "Yes" : "No"}
                            </p>
                        </div>
                    ) : null}

                    <div className="mt-6 space-y-3 rounded-md border p-3">
                        <p className="text-sm font-medium">
                            Session Test Controls
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="examScore">
                                Exam Score (optional, while closing)
                            </Label>
                            <Input
                                id="examScore"
                                type="number"
                                min={0}
                                max={100}
                                value={examScore}
                                onChange={(e) => setExamScore(e.target.value)}
                                placeholder="e.g. 85"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onCheckActive}
                                disabled={checkingActive}
                            >
                                {checkingActive
                                    ? "Checking..."
                                    : "Get Active Session"}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={onCloseSession}
                                disabled={closingSession}
                            >
                                {closingSession
                                    ? "Closing..."
                                    : "Delete Active Session"}
                            </Button>
                        </div>

                        {activeResult ? (
                            <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                                {JSON.stringify(activeResult, null, 2)}
                            </pre>
                        ) : null}

                        {closeResult ? (
                            <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                                {JSON.stringify(closeResult, null, 2)}
                            </pre>
                        ) : null}
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground">
                        Teacher account?{" "}
                        <Link
                            to="/login"
                            className="text-primary hover:underline"
                        >
                            Login
                        </Link>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        New teacher?{" "}
                        <Link
                            to="/signup"
                            className="text-primary hover:underline"
                        >
                            Signup
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default StudentSession;
