export interface Student {
    id: number;
    full_name: string;
    email?: string;
    exam_score?: number;
    score_email_sent?: boolean;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
}
