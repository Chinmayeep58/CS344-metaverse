import api from "@/api/axios";
import type { Certificate } from "@/types/certificate";
import type { Student } from "@/types/student";

export async function getCertificatesByStudent(
    studentId: number,
): Promise<Certificate[]> {
    const { data } = await api.get<{ success: boolean; data: Certificate[] }>(
        `/certificates/student/${studentId}`,
    );
    return data.data ?? [];
}

export async function getTeacherCertificates(
    students: Student[],
): Promise<Certificate[]> {
    const batches = await Promise.all(
        students.map((student) => getCertificatesByStudent(student.id)),
    );

    return batches.flat();
}

export async function revokeCertificate(
    certificateId: number,
): Promise<{ txHash: string }> {
    const { data } = await api.put<{
        success: boolean;
        data: { txHash: string };
    }>(`/certificates/${certificateId}/revoke`);

    return data.data;
}
