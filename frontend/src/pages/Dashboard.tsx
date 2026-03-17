import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import DashboardCard from "@/components/DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { getMyStudents } from "@/api/student.api";
import { getTeacherCertificates } from "@/api/certificate.api";

export default function Dashboard() {
    const { user } = useAuth();
    const { toast } = useToast();

    const [studentCount, setStudentCount] = useState(0);
    const [certificateCount, setCertificateCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const students = await getMyStudents();
                setStudentCount(students.length);

                const certificates = await getTeacherCertificates(students);
                setCertificateCount(certificates.length);
            } catch {
                toast({
                    title: "Could not load dashboard stats",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const copyTeacherCode = async () => {
        if (!user?.teacherCode) return;
        await navigator.clipboard.writeText(user.teacherCode);
        toast({ title: "Teacher code copied" });
    };

    return (
        <AppLayout title="Dashboard">
            <div className="grid gap-4 md:grid-cols-2">
                <DashboardCard
                    title="Total Students"
                    value={loading ? "..." : studentCount}
                    description="Students linked via teacher code"
                />
                <DashboardCard
                    title="Total Certificates Issued"
                    value={loading ? "..." : certificateCount}
                    description="Issued automatically by metaverse"
                />
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Teacher Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                    <p>
                        <span className="font-medium">Full Name:</span>{" "}
                        {user?.fullName}
                    </p>
                    <p>
                        <span className="font-medium">Email:</span>{" "}
                        {user?.email}
                    </p>
                    <p>
                        <span className="font-medium">Wallet Address:</span>{" "}
                        {user?.walletAddress}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="font-medium">Teacher Code:</span>
                        <Badge>{user?.teacherCode}</Badge>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={copyTeacherCode}
                        >
                            Copy Teacher Code
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
