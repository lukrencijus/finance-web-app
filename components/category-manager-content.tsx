"use client"

import { useState, useTransition, useRef } from "react"
import { Trash2, Pencil, Check, XCircle, Plus, X, GripVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    createCategory,
    deleteCategory,
    updateCategory,
    getCategoryTransactions,
    reorderCategories,
} from "@/app/(dashboard)/categories/actions"
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type Category = {
    id: string
    name: string
    icon: string | null
    type: string
    order: number
}

type Transaction = {
    id: string
    amount: number
    description: string | null
    date: Date
    type: string
    monthlySheet: { month: number; year: number }
}

// Confirm Delete Dialog
function ConfirmDeleteDialog({ category, transactions, onConfirm, onCancel, isPending }: {
    category: Category
    transactions: Transaction[]
    onConfirm: () => void
    onCancel: () => void
    isPending: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
                <h3 className="font-semibold text-lg mb-1">Delete "{category.name}"?</h3>
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
                        <div className="max-h-60 overflow-y-auto rounded-lg border border-border mb-5">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50 sticky top-0 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Date</th>
                                        <th className="px-3 py-2 text-left font-medium">Type</th>
                                        <th className="px-3 py-2 text-left font-medium">Description</th>
                                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(t => (
                                        <tr key={t.id} className="border-t border-border">
                                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                                {new Date(t.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    t.type === "INCOME" 
                                                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                                                        : "bg-destructive/10 text-destructive border border-destructive/20"
                                                }`}>
                                                    {t.type === "INCOME" ? "Income" : "Expense"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground italic">{t.description ?? "-"}</td>
                                            <td className={`px-3 py-2 text-right font-bold ${
                                                t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-destructive"
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
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onCancel} disabled={isPending}
                        className="rounded-md border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors text-foreground">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={isPending}
                        className="rounded-md bg-destructive text-destructive-foreground px-4 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
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
    const router = useRouter()

    const handleSave = () => {
        setError(null)
        const fd = new FormData()
        fd.append("icon", iconRef.current?.value ?? "")
        fd.append("name", nameRef.current?.value ?? "")
        startTransition(async () => {
            const result = await updateCategory(category.id, fd)
            if (result?.success) {
                router.refresh()
                onDone()
            }
            else if (result?.error) setError(result.error)
        })
    }

    return (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 rounded-md">
            <GripVertical className="size-4 text-transparent shrink-0" />
            <input ref={iconRef} defaultValue={category.icon ?? ""} placeholder="💰"
                className="w-10 border border-input rounded px-1.5 py-1 text-sm bg-background text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring" />
            <input ref={nameRef} defaultValue={category.name} autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onDone() }}
                className="flex-1 border border-input rounded px-2 py-1 text-sm bg-background text-foreground min-w-0 focus:outline-none focus:ring-1 focus:ring-ring" />
            <button onClick={handleSave} disabled={isPending}
                className="text-green-600 dark:text-green-400 hover:opacity-80 p-0.5 disabled:opacity-50" title="Save">
                <Check className="size-4" />
            </button>
            <button onClick={onDone}
                className="text-muted-foreground hover:text-foreground p-0.5" title="Cancel">
                <XCircle className="size-4" />
            </button>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    )
}

// Sortable category row
function SortableCategoryRow({ category }: { category: Category }) {
    const [editing, setEditing] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const router = useRouter()

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: category.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const handleDeleteClick = async () => {
        const txs = await getCategoryTransactions(category.id)
        setTransactions(txs)
        setShowDialog(true)
    }

    const handleConfirm = async () => {
        setIsPending(true)
        await deleteCategory(category.id)
        router.refresh()
        setIsPending(false)
        setShowDialog(false)
    }

    if (editing) {
        return (
            <li ref={setNodeRef} style={style}>
                <EditCategoryRow category={category} onDone={() => setEditing(false)} />
            </li>
        )
    }

    return (
        <>
            <li ref={setNodeRef} style={style}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors group">
                {/* Drag handle */}
                <button
                    className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5 shrink-0 touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-4" />
                </button>
                <span className="w-6 text-center text-sm shrink-0">{category.icon ?? "-"}</span>
                <span className="flex-1 text-sm text-foreground">{category.name}</span>
                <button onClick={() => setEditing(true)}
                    className="text-muted-foreground/40 hover:text-blue-500 p-1 transition-colors shrink-0"
                    title="Edit"
                    >
                    <Pencil className="size-3.5" />
                </button>
                <button onClick={handleDeleteClick}
                    className="text-muted-foreground/40 hover:text-destructive p-1 transition-colors shrink-0"
                    title="Delete"
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
    const router = useRouter()

    const handleAdd = () => {
        setError(null)
        const fd = new FormData()
        fd.append("icon", iconRef.current?.value ?? "")
        fd.append("name", nameRef.current?.value ?? "")
        fd.append("type", type)
        startTransition(async () => {
            const result = await createCategory(null, fd)
            if (result?.success) {
                router.refresh()
                onClose()
            }
            else if (result?.error) setError(result.error)
        })
    }

    return (
        <div className="space-y-2 p-2 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5">
                <input ref={iconRef} placeholder="💰"
                    className="w-10 border border-input rounded px-1.5 py-1.5 text-sm bg-background text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring" />
                <input ref={nameRef} placeholder="Category name" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onClose() }}
                    className="flex-1 border border-input rounded px-2 py-1.5 text-sm bg-background text-foreground min-w-0 focus:outline-none focus:ring-1 focus:ring-ring" />
                <button onClick={handleAdd} disabled={isPending}
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 shrink-0">
                    {isPending ? "..." : "Add"}
                </button>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-0.5">
                    <X className="size-4" />
                </button>
            </div>
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
    )
}

// Section (one type: INCOME or EXPENSE)
function CategorySection({ type, initialCategories }: {
    type: "INCOME" | "EXPENSE"
    initialCategories: Category[]
}) {
    const [categories, setCategories] = useState(initialCategories)
    const [addingNew, setAddingNew] = useState(false)
    const [, startTransition] = useTransition()
    const router = useRouter()

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 5 }, // prevents accidental drags on click
    }))

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = categories.findIndex(c => c.id === active.id)
        const newIndex = categories.findIndex(c => c.id === over.id)
        const reordered = arrayMove(categories, oldIndex, newIndex)

        setCategories(reordered) // optimistic update
        startTransition(async () => {
            await reorderCategories(reordered.map(c => c.id))
            router.refresh()
        })
    }

    const label = type === "INCOME" ? "Income" : "Expense"
    const badge = type === "INCOME"
        ? "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"
        : "border-destructive/30 text-destructive bg-destructive/10"

    return (
        <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2 px-1">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge}`}>
                    {categories.length}
                </span>
            </div>

            {/* Sortable list */}
            <DndContext id={type} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-0.5">
                        {categories.length === 0 && !addingNew && (
                            <li className="px-3 py-2 text-sm text-muted-foreground italic">
                                No {label.toLowerCase()} categories yet.
                            </li>
                        )}
                        {categories.map(cat => (
                            <SortableCategoryRow key={cat.id} category={cat} />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            {/* Add row */}
            <div className="px-1 pt-1">
                {addingNew ? (
                    <AddCategoryRow type={type} onClose={() => setAddingNew(false)} />
                ) : (
                    <button
                        onClick={() => setAddingNew(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <Plus className="size-3.5 text-muted-foreground/60 group-hover:text-foreground" />
                        Add {label.toLowerCase()} category
                    </button>
                )}
            </div>
        </div>
    )
}

// Main export
export function CategoryManagerContent({ categories }: { categories: Category[] }) {
    const income = categories.filter(c => c.type === "INCOME")
    const expense = categories.filter(c => c.type === "EXPENSE")

    const version = categories.map(c => `${c.id}${c.name}${c.icon}${c.order}`).join('')

    return (
        <div className="space-y-8" key={version}>
            <CategorySection type="INCOME" initialCategories={income} />
            <div className="h-px bg-border/50 mx-1" />
            <CategorySection type="EXPENSE" initialCategories={expense} />
        </div>
    )
}
