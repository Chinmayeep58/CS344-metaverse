export interface User {
    id: number;
    email: string;
    fullName: string;
    walletAddress: string;
    teacherCode: string;
}

export interface AuthResponse {
    token: string;
    user: User;
    message: string;
}
