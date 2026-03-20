import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const { user } = useAuth();
    const { toast } = useToast();

    const copyTeacherCode = async () => {
        if (!user?.teacherCode) return;
        await navigator.clipboard.writeText(user.teacherCode);
        toast({ title: "Teacher code copied" });
    };

    return (
        <header className="flex items-center justify-between border-b bg-background px-4 py-3">
            <div>
                <h1 className="text-base font-semibold">
                    Welcome, {user?.fullName}
                </h1>
                <p className="text-xs text-muted-foreground">
                    VR Disaster Training Platform
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Badge variant="secondary">{user?.teacherCode}</Badge>
                <Button variant="outline" size="sm" onClick={copyTeacherCode}>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy
                </Button>
            </div>
        </header>
    );
}
