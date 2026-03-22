import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "@/api/auth.api";
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
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
    const navigate = useNavigate();
    const { login: setSession } = useAuth();
    const { toast } = useToast();

    const [form, setForm] = useState({
        walletAddress: "",
        email: "",
        fullName: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await signup(form);
            setSession(response.token, response.user);
            toast({
                title: "Signup successful",
                description: `Teacher code: ${response.user.teacherCode}`,
            });
            navigate("/dashboard", { replace: true });
        } catch (error: any) {
            toast({
                title: "Signup failed",
                description:
                    error?.response?.data?.message ||
                    "Could not create account",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Teacher Signup</CardTitle>
                    <CardDescription>
                        Register and receive your unique teacher code.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={form.fullName}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        fullName: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="walletAddress">
                                Wallet Address
                            </Label>
                            <Input
                                id="walletAddress"
                                value={form.walletAddress}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        walletAddress: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Signup"}
                        </Button>
                    </form>

                    <p className="mt-4 text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-primary hover:underline"
                        >
                            Login
                        </Link>
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Student joining training?{" "}
                        <Link
                            to="/student-session"
                            className="text-primary hover:underline"
                        >
                            Go to Student Session
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
