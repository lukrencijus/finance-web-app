"use client"

import { Trash2, type LucideIcon } from "lucide-react"

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Delete",
    pendingLabel = "Deleting...",
    icon: Icon = Trash2,
    onConfirm,
    onCancel,
    isPending = false,
}: {
    open: boolean
    title: string
    message: React.ReactNode
    confirmLabel?: string
    pendingLabel?: string
    icon?: LucideIcon
    onConfirm: () => void
    onCancel: () => void
    isPending?: boolean
}) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{message}</p>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        <Icon className="size-3.5" />
                        {isPending ? pendingLabel : confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isPending}
                        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
