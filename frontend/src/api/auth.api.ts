import api from "@/api/axios";
import type { AuthResponse, User } from "@/types/user";

export interface SignupPayload {
    walletAddress: string;
    email: string;
    fullName: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/signup", payload);
    return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
}

export async function getProfile(): Promise<{ user: User }> {
    const { data } = await api.get<{ user: User }>("/auth/profile");
    return data;
}
