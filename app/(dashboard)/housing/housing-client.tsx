"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, X, Pencil, Plus, LayoutGrid, StickyNote } from "lucide-react"
import { MonthPicker } from "@/components/month-picker"
import { AmountInput } from "@/components/amount-input"
import { formatCurrency } from "@/lib/utils"
import { UNIT_SUFFIX, isMetered, type HousingUnit } from "@/lib/housing-units"
import { ApartmentPanel, type ApartmentSummary } from "./apartment-panel"
import { saveHousingEntry, openHousingMonth } from "./actions"

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

export type HousingCategory = {
    id: string
    name: string
    // SQLite has no enums, so this arrives as a plain string - narrow at use.
    unit: string
    icon: string | null
    color: string
    order: number | null
}

export type HousingEntry = {
    id: string
    housingCategoryId: string
    amount: number | null
    quantity: number | null
    note: string | null
}

type HousingMonthData = {
    id: string
    month: number
    year: number
    entries: HousingEntry[]
} | null

type HistoryItem = {
    id: string
    month: number
    year: number
    total: number
    filled: number
    /** Difference against the previous recorded month; null for the oldest one. */
    change: number | null
}

/** Quantities use the same Lithuanian formatting as money, minus the € sign. */
function formatQuantity(value: number, unit: string): string {
    const number = value.toLocaleString("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${number} ${UNIT_SUFFIX[unit as HousingUnit] ?? ""}`.trim()
}

function EntryRow({
    monthId,
    category,
    entry,
}: {
    monthId: string
    category: HousingCategory
    entry: HousingEntry | undefined
}) {
    const [editing, setEditing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const metered = isMetered(category.unit)
    const hasValue = entry?.amount != null || entry?.quantity != null

    const handleSubmit = (formData: FormData) => {
        setError(null)
        formData.append("housingMonthId", monthId)
        formData.append("housingCategoryId", category.id)
        startTransition(async () => {
            const result = await saveHousingEntry(formData)
            if (result?.error) setError(result.error)
            else {
                setEditing(false)
                router.refresh()
            }
        })
    }

    if (editing) {
        return (
            <li className="rounded-2xl bg-muted/30 border border-border/50 p-3">
                <form action={handleSubmit} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{category.icon ?? "•"}</span>
                        <span className="text-sm font-semibold flex-1 truncate">{category.name}</span>
                        <button type="submit" disabled={isPending}
                            className="text-green-600 dark:text-green-400 hover:opacity-80 p-1 disabled:opacity-50">
                            <Check className="size-4" />
                        </button>
                        <button type="button" onClick={() => { setEditing(false); setError(null) }}
                            className="text-red-600 dark:text-red-400 hover:opacity-80 p-1">
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className={metered ? "grid grid-cols-2 gap-2" : ""}>
                        <div>
                            <label className="block text-[11px] text-muted-foreground mb-1">Paid (€)</label>
                            <AmountInput name="amount" defaultValue={entry?.amount ?? ""} compact />
                        </div>
                        {metered && (
                            <div>
                                <label className="block text-[11px] text-muted-foreground mb-1">
                                    Used ({UNIT_SUFFIX[category.unit as HousingUnit]})
                                </label>
                                <AmountInput name="quantity" defaultValue={entry?.quantity ?? ""} compact />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">Note</label>
                        <input name="note" defaultValue={entry?.note ?? ""} maxLength={100}
                            placeholder="optional"
                            className="w-full border border-input bg-background text-foreground rounded-xl px-2 py-1.5 text-base lg:text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                        Leave everything empty to clear this line.
                    </p>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </form>
            </li>
        )
    }

    return (
        <li>
            <button type="button" onClick={() => setEditing(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-muted/50 active:bg-muted transition-colors text-left group">
                <span className="size-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}>
                    {category.icon ?? "•"}
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm text-foreground truncate">{category.name}</span>
                    {entry?.note && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <StickyNote className="size-3 shrink-0" />
                            {entry.note}
                        </span>
                    )}
                </span>
                <span className="text-right shrink-0">
                    <span className={`block text-sm font-semibold tabular-nums ${hasValue ? "text-foreground" : "text-muted-foreground/40"}`}>
                        {entry?.amount != null ? formatCurrency(entry.amount) : "—"}
                    </span>
                    {metered && entry?.quantity != null && (
                        <span className="block text-[11px] text-muted-foreground tabular-nums">
                            {formatQuantity(entry.quantity, category.unit)}
                        </span>
                    )}
                </span>
                <Pencil className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0" />
            </button>
        </li>
    )
}

export function HousingClient({
    apartment,
    categories,
    housingMonth,
    history,
    allMonths,
    month,
    year,
    isCurrentMonth,
    currentUserId,
}: {
    apartment: ApartmentSummary
    categories: HousingCategory[]
    housingMonth: HousingMonthData
    history: HistoryItem[]
    allMonths: { month: number; year: number }[]
    month: number
    year: number
    isCurrentMonth: boolean
    currentUserId: string
}) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const entriesByCategory = new Map(
        (housingMonth?.entries ?? []).map(e => [e.housingCategoryId, e])
    )
    const total = (housingMonth?.entries ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0)

    const handleOpenMonth = () => {
        startTransition(async () => {
            await openHousingMonth(apartment.id, month, year)
            router.refresh()
        })
    }

    return (
        <div className="max-w-lg mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between gap-2 px-1">
                <h1 className="text-2xl font-semibold truncate">{apartment.name}</h1>
                <Link href="/housing/categories"
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <LayoutGrid className="size-3.5" />
                    Categories
                </Link>
            </div>

            <MonthPicker
                allSheets={allMonths}
                currentMonth={month}
                currentYear={year}
                basePath="/housing"
                isActualCurrentMonth={isCurrentMonth}
            />

            {!housingMonth ? (
                <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Nothing recorded for {MONTH_NAMES[month - 1]} {year} yet.
                    </p>
                    <button onClick={handleOpenMonth} disabled={isPending}
                        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                        <Plus className="size-4" />
                        {isPending ? "Opening..." : "Start this month"}
                    </button>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="flex items-baseline justify-between px-4 py-3 border-b border-border bg-muted/30">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Total paid
                        </span>
                        <span className="text-xl font-bold tabular-nums">{formatCurrency(total)}</span>
                    </div>

                    {categories.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted-foreground italic text-center">
                            No cost categories yet.{" "}
                            <Link href="/housing/categories" className="text-primary hover:underline">
                                Add some
                            </Link>
                            .
                        </p>
                    ) : (
                        <ul className="p-2 space-y-0.5">
                            {categories.map(category => (
                                <EntryRow
                                    key={category.id}
                                    monthId={housingMonth.id}
                                    category={category}
                                    entry={entriesByCategory.get(category.id)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {history.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                        Recent months
                    </p>
                    <ul className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                        {history.map(item => (
                            <li key={item.id}>
                                <Link href={`/housing?month=${item.month}&year=${item.year}`}
                                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                                    <span className="min-w-0">
                                        <span className="block text-sm truncate">
                                            {MONTH_NAMES[item.month - 1]} {item.year}
                                        </span>
                                        <span className="block text-[11px] text-muted-foreground">
                                            {item.filled} of {categories.length} filled
                                        </span>
                                    </span>
                                    <span className="text-right shrink-0">
                                        <span className="block text-sm font-semibold tabular-nums">
                                            {formatCurrency(item.total)}
                                        </span>
                                        {item.change !== null && item.change !== 0 && (
                                            // Housing costs are all outgoings, so more is worse:
                                            // red for a rise, green for a drop.
                                            <span className={`block text-[11px] tabular-nums ${item.change > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                                {item.change > 0 ? "+" : "−"}{formatCurrency(Math.abs(item.change))}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground px-1">
                        Older months are in the month picker above.
                    </p>
                </div>
            )}

            <ApartmentPanel apartment={apartment} currentUserId={currentUserId} />
        </div>
    )
}
