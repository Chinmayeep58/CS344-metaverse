import api from "@/api/axios";
import type { Student } from "@/types/student";

export async function getMyStudents(): Promise<Student[]> {
    const { data } = await api.get<{ success: boolean; data: Student[] }>(
        "/students/my-students",
    );
    return data.data ?? [];
}
