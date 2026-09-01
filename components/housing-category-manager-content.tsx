"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { Trash2, Pencil, Check, XCircle, Plus, X, GripVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { HOUSING_UNITS, UNIT_LABEL, UNIT_SUFFIX, type HousingUnit } from "@/lib/housing-units"
import {
    createHousingCategory,
    updateHousingCategory,
    deleteHousingCategory,
    getHousingCategoryEntries,
    reorderHousingCategories,
} from "@/app/(dashboard)/housing/actions"
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
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers"
import { useHaptics } from "@/lib/use-haptics"

export type HousingCategory = {
    id: string
    name: string
    // Plain String? column (SQLite has no enums) - narrow at the point of use.
    unit: string
    icon: string | null
    color: string
    order: number | null
}

type HousingEntry = {
    id: string
    amount: number | null
    quantity: number | null
    housingMonth: { month: number; year: number }
}

const PRESET_COLORS = [
    "#EF4444", "#F97316", "#F59E0B", "#22C55E", "#06B6D4",
    "#3B82F6", "#6366F1", "#A855F7", "#EC4899", "#64748B",
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    return (
        <div className="flex flex-wrap gap-1.5 items-center">
            {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => onChange(c)}
                    className="w-5 h-5 rounded-xl transition-transform hover:scale-110 focus:outline-none shrink-0"
                    style={{
                        backgroundColor: c,
                        boxShadow: value === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined,
                    }} />
            ))}
            <label
                className="w-5 h-5 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer relative overflow-hidden hover:border-muted-foreground transition-colors shrink-0"
                title="Custom color"
                style={{ backgroundColor: PRESET_COLORS.includes(value) ? "transparent" : value }}
            >
                <input type="color" value={value} onChange={e => onChange(e.target.value)}
                    className="absolute opacity-0 w-full h-full cursor-pointer" />
                {PRESET_COLORS.includes(value) && (
                    <span className="text-[8px] text-muted-foreground pointer-events-none">+</span>
                )}
            </label>
        </div>
    )
}

/**
 * The unit decides whether the month form asks for a meter reading next to the
 * euros. Euros are recorded either way, so switching unit never hides money.
 */
function UnitSelector({ value, onChange }: { value: HousingUnit; onChange: (u: HousingUnit) => void }) {
    return (
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl">
            {HOUSING_UNITS.map(unit => (
                <button key={unit} type="button" onClick={() => onChange(unit)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-medium transition-colors
                        ${value === unit ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {unit === "EUR" ? "€ only" : `€ + ${UNIT_SUFFIX[unit]}`}
                </button>
            ))}
        </div>
    )
}

function CategoryFields({
    icon, setIcon, color, setColor, unit, setUnit,
}: {
    icon: string
    setIcon: (v: string) => void
    color: string
    setColor: (v: string) => void
    unit: HousingUnit
    setUnit: (v: HousingUnit) => void
}) {
    return (
        <>
            <div>
                <p className="text-xs text-muted-foreground mb-1.5">Icon</p>
                <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={8}
                    placeholder="🏠"
                    className="w-16 border border-input rounded-xl px-2 py-1 text-base bg-background text-center focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground mb-1.5">Measured in</p>
                <UnitSelector value={unit} onChange={setUnit} />
                <p className="text-[10px] text-muted-foreground mt-1.5">{UNIT_LABEL[unit]}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground mb-1.5">Color</p>
                <ColorPicker value={color} onChange={setColor} />
            </div>
        </>
    )
}

const DELETE_LIST_PAGE_SIZE = 10

function ConfirmDeleteDialog({ category, entries, onConfirm, onCancel, isPending }: {
    category: HousingCategory
    entries: HousingEntry[]
    onConfirm: () => void
    onCancel: () => void
    isPending: boolean
}) {
    const [page, setPage] = useState(1)
    const pageCount = Math.max(1, Math.ceil(entries.length / DELETE_LIST_PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    const start = (currentPage - 1) * DELETE_LIST_PAGE_SIZE
    const pageItems = entries.slice(start, start + DELETE_LIST_PAGE_SIZE)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
                <h3 className="font-semibold text-lg mb-1">Delete &quot;{category.name}&quot;?</h3>
                {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-5">
                        Nothing has been recorded for this category. It will be permanently deleted.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-3">
                            This will permanently delete{" "}
                            <span className="font-medium text-foreground">
                                {entries.length} recorded month{entries.length !== 1 ? "s" : ""}
                            </span>{" "}
                            of this cost.
                        </p>
                        <div className="max-h-60 overflow-y-auto rounded-xl border border-border mb-5">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50 sticky top-0 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Month</th>
                                        <th className="px-3 py-2 text-right font-medium">Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map(e => (
                                        <tr key={e.id} className="border-t border-border">
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {e.housingMonth.month}/{e.housingMonth.year}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-foreground">
                                                {e.amount != null ? formatCurrency(e.amount) : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pageCount > 1 && (
                            <div className="flex items-center justify-between mb-5 -mt-3">
                                <button type="button" onClick={() => setPage(p => p - 1)} disabled={currentPage <= 1}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors">
                                    Previous
                                </button>
                                <span className="text-xs text-muted-foreground">
                                    Page {currentPage} of {pageCount}
                                </span>
                                <button type="button" onClick={() => setPage(p => p + 1)} disabled={currentPage >= pageCount}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors">
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onCancel} disabled={isPending}
                        className="rounded-xl border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors text-foreground">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={isPending}
                        className="rounded-xl bg-destructive text-destructive-foreground px-4 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                        {isPending ? "Deleting..." : "Yes, delete"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function EditCategoryRow({ category, onDone }: { category: HousingCategory; onDone: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [color, setColor] = useState(category.color)
    const [icon, setIcon] = useState(category.icon ?? "")
    const [unit, setUnit] = useState<HousingUnit>(category.unit as HousingUnit)
    const nameRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleSave = () => {
        setError(null)
        const fd = new FormData()
        fd.append("name", nameRef.current?.value ?? "")
        fd.append("color", color)
        fd.append("icon", icon)
        fd.append("unit", unit)
        startTransition(async () => {
            const result = await updateHousingCategory(category.id, fd)
            if (result?.success) { router.refresh(); onDone() }
            else if (result?.error) setError(result.error)
        })
    }

    return (
        <div className="space-y-3 px-3 py-2 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-1.5">
                <GripVertical className="size-4 text-transparent shrink-0" />
                <input ref={nameRef} defaultValue={category.name} autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onDone() }}
                    className="flex-1 border border-input rounded-xl px-2 py-1 text-sm bg-background text-foreground min-w-0 focus:outline-none focus:ring-1 focus:ring-ring" />
                <button onClick={handleSave} disabled={isPending}
                    className="text-green-600 dark:text-green-400 hover:opacity-80 p-0.5 disabled:opacity-50">
                    <Check className="size-4" />
                </button>
                <button onClick={onDone} className="text-red-600 dark:text-red-400 hover:opacity-80 p-0.5">
                    <XCircle className="size-4" />
                </button>
            </div>
            <div className="pl-6 space-y-3">
                <CategoryFields icon={icon} setIcon={setIcon} color={color} setColor={setColor} unit={unit} setUnit={setUnit} />
                {unit === "EUR" && category.unit !== "EUR" && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Switching to euros only clears the {UNIT_SUFFIX[category.unit as HousingUnit]} readings
                        already recorded for this category. Amounts are kept.
                    </p>
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        </div>
    )
}

function SortableCategoryRow({ category }: { category: HousingCategory }) {
    const [editing, setEditing] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [entries, setEntries] = useState<HousingEntry[]>([])
    const router = useRouter()

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: category.id })

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

    const handleDeleteClick = async () => {
        setEntries(await getHousingCategoryEntries(category.id))
        setShowDialog(true)
    }

    const handleConfirm = async () => {
        setIsPending(true)
        await deleteHousingCategory(category.id)
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors group">
                <button type="button"
                    className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5 shrink-0 touch-none"
                    {...attributes} {...listeners}>
                    <GripVertical className="size-4" />
                </button>
                <span className="size-6 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}>
                    {category.icon ?? "•"}
                </span>
                <span className="flex-1 text-sm text-foreground truncate">
                    {category.name}
                    {category.unit !== "EUR" && (
                        <span className="ml-1.5 text-[10px] font-medium text-muted-foreground align-middle">
                            {UNIT_SUFFIX[category.unit as HousingUnit]}
                        </span>
                    )}
                </span>
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
                <ConfirmDeleteDialog category={category} entries={entries}
                    onConfirm={handleConfirm} onCancel={() => setShowDialog(false)} isPending={isPending} />
            )}
        </>
    )
}

function AddCategoryRow({ apartmentId, onClose }: { apartmentId: string; onClose: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [color, setColor] = useState("#64748B")
    const [icon, setIcon] = useState("")
    const [unit, setUnit] = useState<HousingUnit>("EUR")
    const nameRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleAdd = () => {
        setError(null)
        const fd = new FormData()
        fd.append("name", nameRef.current?.value ?? "")
        fd.append("color", color)
        fd.append("icon", icon)
        fd.append("unit", unit)
        startTransition(async () => {
            const result = await createHousingCategory(apartmentId, fd)
            if (result?.success) { router.refresh(); onClose() }
            else if (result?.error) setError(result.error)
        })
    }

    return (
        <div className="space-y-3 p-2 bg-muted/20 rounded-xl border border-border/50">
            <div className="flex items-center gap-1.5">
                <input ref={nameRef} placeholder="e.g. Internet" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onClose() }}
                    className="flex-1 border border-input rounded-xl px-2 py-1.5 text-sm bg-background text-foreground min-w-0 focus:outline-none focus:ring-1 focus:ring-ring" />
                <button onClick={handleAdd} disabled={isPending}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 shrink-0">
                    {isPending ? "..." : "Add"}
                </button>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-0.5">
                    <X className="size-4" />
                </button>
            </div>
            <CategoryFields icon={icon} setIcon={setIcon} color={color} setColor={setColor} unit={unit} setUnit={setUnit} />
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
    )
}

export function HousingCategoryManagerContent({
    apartmentId,
    categories,
}: {
    apartmentId: string
    categories: HousingCategory[]
}) {
    const [items, setItems] = useState(categories)
    const [addingNew, setAddingNew] = useState(false)
    const [, startTransition] = useTransition()
    const { trigger } = useHaptics()

    useEffect(() => {
        // Keep the locally-reorderable copy in sync with the server-fetched list.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(categories)
    }, [categories])

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        trigger("nudge")
        const oldIndex = items.findIndex(c => c.id === active.id)
        const newIndex = items.findIndex(c => c.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        setItems(reordered)
        startTransition(async () => {
            await reorderHousingCategories(apartmentId, reordered.map(c => c.id))
        })
    }

    return (
        <div className="space-y-3">
            <DndContext id="housing-categories" sensors={sensors} collisionDetection={closestCenter}
                onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
                <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-0.5">
                        {items.length === 0 && !addingNew && (
                            <li className="px-3 py-2 text-sm text-muted-foreground italic">
                                No cost categories yet.
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
                    <AddCategoryRow apartmentId={apartmentId} onClose={() => setAddingNew(false)} />
                ) : (
                    <button onClick={() => setAddingNew(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group">
                        <Plus className="size-3.5 text-muted-foreground/60 group-hover:text-foreground" />
                        Add cost category
                    </button>
                )}
            </div>
        </div>
    )
}
