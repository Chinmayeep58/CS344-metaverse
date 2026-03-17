import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import CertificateTable from "@/components/CertificateTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getMyStudents } from "@/api/student.api";
import {
    getTeacherCertificates,
    revokeCertificate as revokeCertificateApi,
} from "@/api/certificate.api";
import type { Student } from "@/types/student";
import type { Certificate, CertificateRow } from "@/types/certificate";

export default function Certificates() {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    const rows = useMemo<CertificateRow[]>(() => {
        const studentMap = new Map(students.map((s) => [s.id, s]));
        return certificates.map((certificate) => {
            const student = studentMap.get(certificate.student_id);
            return {
                ...certificate,
                studentName: student?.full_name || "Unknown",
                studentEmail: student?.email || "N/A",
                examScore:
                    student?.exam_score === undefined
                        ? "N/A"
                        : student.exam_score,
            };
        });
    }, [students, certificates]);

    const load = async () => {
        try {
            setLoading(true);
            const studentsData = await getMyStudents();
            setStudents(studentsData);

            const certs = await getTeacherCertificates(studentsData);
            setCertificates(certs);
        } catch {
            toast({
                title: "Could not load certificates",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const revokeCertificate = async (tokenId: number) => {
        try {
            await revokeCertificateApi(tokenId);
            toast({ title: `Certificate ${tokenId} revoked` });
            await load();
        } catch (error: any) {
            toast({
                title: "Revoke failed",
                description: error?.response?.data?.message || "Try again",
                variant: "destructive",
            });
        }
    };

    return (
        <AppLayout title="Certificates">
            <Card>
                <CardHeader>
                    <CardTitle>Issued Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">
                            Loading certificates...
                        </p>
                    ) : (
                        <CertificateTable
                            certificates={rows}
                            onRevoke={revokeCertificate}
                        />
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
