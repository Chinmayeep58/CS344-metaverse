import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    loading = false,
    onCancel,
    onConfirm,
}: ConfirmDialogProps): ReactNode {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-lg">
                <h3 className="text-base font-semibold">{title}</h3>
                {description ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
                <div className="mt-5 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
