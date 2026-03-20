import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {
    const { token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                Loading...
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
