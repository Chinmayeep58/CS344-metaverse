import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function AppLayout({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/30 md:flex">
            <Sidebar />
            <div className="flex-1">
                <Navbar />
                <main className="p-4 md:p-6">
                    <h2 className="mb-4 text-xl font-semibold">{title}</h2>
                    {children}
                </main>
            </div>
        </div>
    );
}
