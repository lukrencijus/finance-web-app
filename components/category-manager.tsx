"use client"

import { useState, useTransition, useRef } from "react"
import { X, Trash2, Plus, Pencil, Check, XCircle } from "lucide-react"
import { createCategory, deleteCategory, updateCategory, getCategoryTransactions } from "@/app/(dashboard)/categories/actions"

type Category = {
    id: string
    name: string
    icon: string | null
    type: string
}

type Transaction = {
    id: string
    amount: number
    description: string | null
    date: Date
    type: string
    monthlySheet: { month: number; year: number }
}

// Confirm Delete Dialog (same as category-table)
function ConfirmDeleteDialog({ category, transactions, onConfirm, onCancel, isPending }: {
    category: Category
    transactions: Transaction[]
    onConfirm: () => void
    onCancel: () => void
    isPending: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background border rounded-xl shadow-lg p-6 max-w-lg w-full mx-4">
                <h3 className="font-semibold text-base mb-1">Delete "{category.name}"?</h3>
                {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-5">
                        This category has no transactions. It will be permanently deleted.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-3">
                            This will permanently delete{" "}
                            <span className="font-medium text-foreground">
                                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                            </span>:
                        </p>
                        <div className="max-h-60 overflow-y-auto rounded-lg border mb-5">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Date</th>
                                        <th className="px-3 py-2 text-left">Type</th>
                                        <th className="px-3 py-2 text-left">Description</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(t => (
                                        <tr key={t.id} className="border-t">
                                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                                {new Date(t.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                    t.type === "INCOME" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                    {t.type === "INCOME" ? "Income" : "Expense"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">{t.description ?? "-"}</td>
                                            <td className={`px-3 py-2 text-right font-medium ${
                                                t.type === "INCOME" ? "text-green-600" : "text-red-500"
                                            }`}>
                                                {t.type === "INCOME" ? "+" : "-"}€{t.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={isPending}
                        className="rounded border px-4 py-1.5 text-xs hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="rounded bg-destructive text-destructive-foreground px-4 py-1.5 text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {isPending ? "Deleting..." : "Yes, delete"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Edit row
function EditCategoryRow({ category, onDone }: { category: Category; onDone: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const iconRef = useRef<HTMLInputElement>(null)
    const nameRef = useRef<HTMLInputElement>(null)

    const handleSave = () => {
        setError(null)
        const fd = new FormData()
        fd.append("icon", iconRef.current?.value ?? "")
        fd.append("name", nameRef.current?.value ?? "")
        startTransition(async () => {
            const result = await updateCategory(category.id, fd)
            if (result?.success) onDone()
            else if (result?.error) setError(result.error)
        })
    }

    return (
        <div className="flex items-center gap-1.5">
            <input
                ref={iconRef}
                defaultValue={category.icon ?? ""}
                placeholder="🏷️"
                className="w-10 border rounded px-1.5 py-1 text-sm bg-background text-center"
            />
            <input
                ref={nameRef}
                defaultValue={category.name}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onDone() }}
                className="flex-1 border rounded px-2 py-1 text-sm bg-background min-w-0"
            />
            <button
                onClick={handleSave}
                disabled={isPending}
                className="text-green-600 hover:text-green-700 p-0.5 disabled:opacity-50"
                title="Save"
            >
                <Check className="size-3.5" />
            </button>
            <button
                onClick={onDone}
                className="text-muted-foreground hover:text-foreground p-0.5"
                title="Cancel"
            >
                <XCircle className="size-3.5" />
            </button>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    )
}

// Category row
function CategoryRow({ category }: { category: Category }) {
    const [editing, setEditing] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [transactions, setTransactions] = useState<Transaction[]>([])

    const handleDeleteClick = async () => {
        const txs = await getCategoryTransactions(category.id)
        setTransactions(txs)
        setShowDialog(true)
    }

    const handleConfirm = async () => {
        setIsPending(true)
        await deleteCategory(category.id)
        setIsPending(false)
        setShowDialog(false)
    }

    if (editing) {
        return (
            <li className="px-3 py-2">
                <EditCategoryRow category={category} onDone={() => setEditing(false)} />
            </li>
        )
    }

    return (
        <>
            <li className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 group transition-colors">
                <span className="w-6 text-center text-sm">{category.icon ?? "-"}</span>
                <span className="flex-1 text-sm">{category.name}</span>
                <button
                    onClick={() => setEditing(true)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5 transition-all"
                >
                    <Pencil className="size-3.5" />
                </button>
                <button
                    onClick={handleDeleteClick}
                    className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive p-0.5 transition-all"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </li>

            {showDialog && (
                <ConfirmDeleteDialog
                    category={category}
                    transactions={transactions}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowDialog(false)}
                    isPending={isPending}
                />
            )}
        </>
    )
}

// Add row
function AddCategoryRow({ type, onClose }: { type: "INCOME" | "EXPENSE"; onClose: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const iconRef = useRef<HTMLInputElement>(null)
    const nameRef = useRef<HTMLInputElement>(null)

    const handleAdd = () => {
        setError(null)
        const fd = new FormData()
        fd.append("icon", iconRef.current?.value ?? "")
        fd.append("name", nameRef.current?.value ?? "")
        fd.append("type", type)
        startTransition(async () => {
            const result = await createCategory(null, fd)
            if (result?.success) onClose()
            else if (result?.error) setError(result.error)
        })
    }

    return (
        <div className="px-3 py-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
                <input
                    ref={iconRef}
                    placeholder="🏷️"
                    className="w-10 border rounded px-1.5 py-1.5 text-sm bg-background text-center"
                />
                <input
                    ref={nameRef}
                    placeholder="Name"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onClose() }}
                    className="flex-1 border rounded px-2 py-1.5 text-sm bg-background min-w-0"
                />
                <button
                    onClick={handleAdd}
                    disabled={isPending}
                    className="px-2.5 py-1.5 rounded bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-50 shrink-0"
                >
                    {isPending ? "..." : "Add"}
                </button>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-0.5">
                    <X className="size-4" />
                </button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}

function AddCategoryButton({ type }: { type: "INCOME" | "EXPENSE" }) {
    const [open, setOpen] = useState(false)
    if (open) return <AddCategoryRow type={type} onClose={() => setOpen(false)} />
    return (
        <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
        >
            <Plus className="size-3.5" />
            Add category
        </button>
    )
}


export function CategoryManager({ type, categories }: {
    type: "INCOME" | "EXPENSE"
    categories: Category[]
}) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
                Manage
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-base">
                                {type === "INCOME" ? "Income" : "Expense"} Categories
                            </h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <ul className="space-y-0.5 max-h-64 overflow-y-auto mb-4">
                            {categories.length === 0 ? (
                                <li className="py-2 text-sm text-muted-foreground">No categories yet.</li>
                            ) : (
                                categories.map(cat => <CategoryRow key={cat.id} category={cat} />)
                            )}
                        </ul>

                        <div className="border-t pt-3">
                            <AddCategoryButton type={type} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}