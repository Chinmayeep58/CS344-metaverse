import api from "./axios";

export type JoinSessionPayload = {
    teacher_code: string;
    name: string;
    email: string;
};

export type JoinSessionResponse = {
    success: boolean;
    message?: string;
    student_id?: number;
    student_full_name?: string;
    student_email?: string;
    session?: {
        session_id: string;
        status: string;
        started_at: string;
        reused: boolean;
    };
};

export const joinStudentSession = async (
    payload: JoinSessionPayload,
): Promise<JoinSessionResponse> => {
    const response = await api.post<JoinSessionResponse>(
        "/students/join",
        payload,
    );
    return response.data;
};
