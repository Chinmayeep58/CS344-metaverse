import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive";

interface ToastItem {
    id: number;
    title: string;
    description?: string;
    variant?: ToastVariant;
}

interface ToastContextValue {
    toast: (input: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let toastSeq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const toast: ToastContextValue["toast"] = ({
        title,
        description,
        variant,
    }) => {
        const id = toastSeq++;
        setItems((prev) => [...prev, { id, title, description, variant }]);
        window.setTimeout(() => {
            setItems((prev) => prev.filter((it) => it.id !== id));
        }, 3000);
    };

    const value = useMemo(() => ({ toast }), []);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[320px] flex-col gap-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "pointer-events-auto rounded-lg border bg-card p-3 shadow-md",
                            item.variant === "destructive" &&
                                "border-destructive/40",
                        )}
                    >
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.description ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {item.description}
                            </p>
                        ) : null}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return ctx;
}

export function Toaster() {
    return null;
}
