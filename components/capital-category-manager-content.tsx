"use client"

import { useState, useTransition, useRef } from "react"
import { Trash2, Pencil, Check, XCircle, Plus, X, GripVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    createCapitalCategory,
    deleteCapitalCategory,
    updateCapitalCategory,
    getCapitalCategoryCapitals,
    reorderCapitalCategories,
} from "@/app/(dashboard)/capital/actions"
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

export type CapitalCategory = {
    id: string
    name: string
    icon: string | null
    order: number | null
}

type CapitalEntry = {
    id: string
    amount: number
    monthlySheet: { month: number; year: number }
}

function ConfirmDeleteDialog({ category, capitals, onConfirm, onCancel, isPending }: {
    category: CapitalCategory
    capitals: CapitalEntry[]
    onConfirm: () => void
    onCancel: () => void
    isPending: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
                <h3 className="font-semibold text-lg mb-1">Delete "{category.name}"?</h3>
                {capitals.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-5">
                        This category has no entries. It will be permanently deleted.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-3">
                            This will permanently delete{" "}
                            <span className="font-medium text-foreground">
                                {capitals.length} capital entr{capitals.length !== 1 ? "ies" : "y"}
                            </span>{" "}
                            across monthly sheets.
                        </p>
                        <div className="max-h-60 overflow-y-auto rounded-lg border border-border mb-5">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50 sticky top-0 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Month</th>
                                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {capitals.map(c => (
                                        <tr key={c.id} className="border-t border-border">
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {c.monthlySheet.month}/{c.monthlySheet.year}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-foreground">
                                                €{c.amount.toFixed(2)}
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

function EditCategoryRow({ category, onDone }: { category: CapitalCategory; onDone: () => void }) {
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
            const result = await updateCapitalCategory(category.id, fd)
            if (result?.success) { router.refresh(); onDone() }
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
                className="text-green-600 dark:text-green-400 hover:opacity-80 p-0.5 disabled:opacity-50">
                <Check className="size-4" />
            </button>
            <button onClick={onDone}
                className="text-red-600 dark:text-red-400 hover:opacity-80 p-0.5">
                <XCircle className="size-4" />
            </button>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    )
}

function SortableCategoryRow({ category }: { category: CapitalCategory }) {
    const [editing, setEditing] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [capitals, setCapitals] = useState<CapitalEntry[]>([])
    const router = useRouter()

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: category.id })

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

    const handleDeleteClick = async () => {
        const entries = await getCapitalCategoryCapitals(category.id)
        setCapitals(entries)
        setShowDialog(true)
    }

    const handleConfirm = async () => {
        setIsPending(true)
        await deleteCapitalCategory(category.id)
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
                <button type="button"
                    className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5 shrink-0 touch-none"
                    {...attributes} {...listeners}>
                    <GripVertical className="size-4" />
                </button>
                <span className="w-6 text-center text-sm shrink-0">{category.icon ?? "-"}</span>
                <span className="flex-1 text-sm text-foreground">{category.name}</span>
                <button onClick={() => setEditing(true)}
                    className="text-muted-foreground/40 hover:text-blue-500 p-1 transition-colors shrink-0">
                    <Pencil className="size-3.5" />
                </button>
                <button type="button" onClick={handleDeleteClick}
                    className="text-muted-foreground/40 hover:text-destructive p-1 transition-colors shrink-0">
                    <Trash2 className="size-3.5" />
                </button>
            </li>
            {showDialog && (
                <ConfirmDeleteDialog
                    category={category}
                    capitals={capitals}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowDialog(false)}
                    isPending={isPending}
                />
            )}
        </>
    )
}

function AddCategoryRow({ onClose }: { onClose: () => void }) {
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
        startTransition(async () => {
            const result = await createCapitalCategory(null, fd)
            if (result?.success) { router.refresh(); onClose() }
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

export function CapitalCategoryManagerContent({ categories }: { categories: CapitalCategory[] }) {
    const [items, setItems] = useState(categories)
    const [addingNew, setAddingNew] = useState(false)
    const [, startTransition] = useTransition()

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = items.findIndex(c => c.id === active.id)
        const newIndex = items.findIndex(c => c.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        setItems(reordered)
        startTransition(async () => {
            await reorderCapitalCategories(reordered.map(c => c.id))
        })
    }

    return (
        <div className="space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-0.5">
                        {items.length === 0 && !addingNew && (
                            <li className="px-3 py-2 text-sm text-muted-foreground italic">
                                No capital categories yet.
                            </li>
                        )}
                        {items.map(cat => (
                            <SortableCategoryRow key={cat.id} category={cat} />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>
            <div className="px-1 pt-1">
                {addingNew ? (
                    <AddCategoryRow onClose={() => setAddingNew(false)} />
                ) : (
                    <button onClick={() => setAddingNew(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group">
                        <Plus className="size-3.5 text-muted-foreground/60 group-hover:text-foreground" />
                        Add capital category
                    </button>
                )}
            </div>
        </div>
    )
}