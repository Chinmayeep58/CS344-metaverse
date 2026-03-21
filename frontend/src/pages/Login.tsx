import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "@/api/auth.api";
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

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login: setSession } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await login({ email: email.trim(), password });
            setSession(response.token, response.user);
            toast({ title: "Login successful" });
            const redirectTo = (
                location.state as { from?: { pathname?: string } }
            )?.from?.pathname;
            navigate(redirectTo || "/dashboard", { replace: true });
        } catch (error: any) {
            toast({
                title: "Login failed",
                description:
                    error?.response?.data?.message ||
                    "Please check your credentials",
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
                    <CardTitle>Teacher Login</CardTitle>
                    <CardDescription>
                        Login to view students, scores, and certificates.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Login"}
                        </Button>
                    </form>

                    <p className="mt-4 text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="text-primary hover:underline"
                        >
                            Create one
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
