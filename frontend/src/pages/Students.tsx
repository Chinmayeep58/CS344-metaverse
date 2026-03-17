import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import StudentTable from "@/components/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getMyStudents } from "@/api/student.api";
import type { Student } from "@/types/student";

export default function Students() {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const result = await getMyStudents();
                setStudents(result);
            } catch {
                toast({
                    title: "Could not load students",
                    description: "Please try again",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    return (
        <AppLayout title="Students">
            <Card>
                <CardHeader>
                    <CardTitle>Students & Exam Scores</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">
                            Loading students...
                        </p>
                    ) : (
                        <StudentTable students={students} />
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
