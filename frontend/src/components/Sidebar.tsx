import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ScrollText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/students", label: "Students", icon: Users },
    { to: "/certificates", label: "Certificates", icon: ScrollText },
];

export default function Sidebar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="w-full border-r bg-sidebar p-4 md:w-64">
            <div className="mb-6">
                <h2 className="text-lg font-bold">VR Disaster Training</h2>
                <p className="text-xs text-muted-foreground">
                    Teacher Dashboard
                </p>
            </div>

            <nav className="space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted",
                                )
                            }
                        >
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </NavLink>
                    );
                })}
            </nav>

            <Button
                variant="outline"
                className="mt-6 w-full justify-start"
                onClick={onLogout}
            >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </aside>
    );
}
