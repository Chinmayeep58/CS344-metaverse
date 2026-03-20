import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function Badge({
    className,
    variant = "default",
    ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
    const styles: Record<BadgeVariant, string> = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/20 text-destructive",
        outline: "border border-border text-foreground",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                styles[variant],
                className,
            )}
            {...props}
        />
    );
}
