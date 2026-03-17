import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { getProfile } from "@/api/auth.api";
import type { User } from "@/types/user";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("auth_token"),
    );
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
    };

    const refreshProfile = async () => {
        if (!token) {
            setUser(null);
            return;
        }

        try {
            const profile = await getProfile();
            setUser(profile.user);
        } catch {
            logout();
        }
    };

    useEffect(() => {
        const boot = async () => {
            setLoading(true);
            if (token) {
                await refreshProfile();
            }
            setLoading(false);
        };

        void boot();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("auth_token", newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const value = useMemo(
        () => ({ user, token, loading, login, logout, refreshProfile }),
        [user, token, loading],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return ctx;
}
