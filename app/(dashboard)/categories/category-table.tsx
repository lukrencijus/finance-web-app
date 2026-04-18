"use client"
import { useState, Fragment } from "react"
import { updateCategory, deleteCategory, getCategoryTransactions } from "./actions"

type Transaction = {
    id: string
    amount: number
    description: string | null
    date: Date
    type: string
    monthlySheet: { month: number; year: number }
}

type Category = {
    id: string
    name: string
    type: string
    icon: string | null
}

// Confirmation Dialog
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
                            This will permanently delete <span className="font-medium text-foreground">{transactions.length} transaction{transactions.length !== 1 ? "s" : ""}</span>:
                        </p>

                        {/* Transaction list */}
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
                                                    t.type === "INCOME"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                    {t.type === "INCOME" ? "Income" : "Expense"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {t.description ?? "-"}
                                            </td>
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

// Delete Button with confirmation
function DeleteButton({ category }: { category: Category }) {
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

    return (
        <>
            <button
                onClick={handleDeleteClick}
                className="rounded border border-destructive/20 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
            >
                Delete
            </button>

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

// Main Table
export function CategoryTable({ categories }: { categories: Category[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    return (
        <div className="rounded-xl border overflow-hidden bg-background">
            <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/50">
                    <tr>
                        <th className="px-4 py-3 w-16 text-center">Icon</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat) => {
                        const isExpanded = expandedId === cat.id
                        return (
                            <Fragment key={cat.id}>
                                <tr className={`border-b last:border-b-0 transition-colors ${isExpanded ? "bg-muted/30" : "hover:bg-muted/10"}`}>
                                    <td className="px-4 py-3 text-lg text-center">{cat.icon ?? "-"}</td>
                                    <td className="px-4 py-3 font-medium">{cat.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                                                className="rounded border px-3 py-1 text-xs hover:bg-background"
                                            >
                                                {isExpanded ? "Close" : "Edit"}
                                            </button>
                                            <DeleteButton category={cat} />
                                        </div>
                                    </td>
                                </tr>

                                {isExpanded && (
                                    <tr className="border-b bg-muted/20 shadow-inner">
                                        <td colSpan={3} className="px-8 py-4">
                                            <form
                                                action={async (formData) => {
                                                    await updateCategory(cat.id, formData)
                                                    setExpandedId(null)
                                                }}
                                                className="flex flex-wrap items-end gap-4"
                                            >
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Icon</label>
                                                    <input
                                                        name="icon"
                                                        defaultValue={cat.icon ?? ""}
                                                        placeholder="e.g. 🥑"
                                                        className="border rounded-md px-3 py-1.5 text-sm bg-background w-20"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                                                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Category Name</label>
                                                    <input
                                                        name="name"
                                                        defaultValue={cat.name}
                                                        className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-xs font-medium hover:opacity-90"
                                                >
                                                    Save Changes
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}