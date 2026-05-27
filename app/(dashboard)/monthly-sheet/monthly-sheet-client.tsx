"use client"

import { useState, useEffect, useActionState } from "react"
import {
    createTransaction,
    deleteTransaction,
    updateTransaction,
    createCapital,
    updateCapital,
    deleteCapital,
    toggleRecurring,
    createSplitTransaction,
    deleteSplitGroup,
} from "./actions"
import { Trash2, ChevronDown, Pencil, Check, XCircle, RefreshCw, Scissors } from "lucide-react"
import Link from "next/link"
import { CategoryManager } from "@/components/category-manager"
import { type Category } from "@/components/category-manager-content"
import { CapitalCategoryManager } from "@/components/capital-category-manager"
import { type CapitalCategory } from "@/components/capital-category-manager-content"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

type Capital = {
    id: string
    amount: number
    order: number | null
    capitalCategory: { id: string; name: string; color: string }
    capitalCategoryId: string
}

type Transaction = {
    id: string
    amount: number
    description: string | null
    date: Date | string
    type: string
    category: { name: string; icon: string | null }
    categoryId: string
    isRecurring: boolean
    splitMonths: number | null
    splitIndex: number | null
    splitGroupId: string | null
}

type Sheet = {
    id: string
    month: number
    year: number
    transactions: Transaction[]
    capitals: Capital[]
}

type SheetSummary = { month: number; year: number }

type Props = {
    sheet: Sheet | null
    categories: Category[]
    capitalCategories: CapitalCategory[]
    allSheets: SheetSummary[]
    month: number
    year: number
    isCurrentMonth: boolean
    isFuture: boolean
    serverCurrentMonth: number
    serverCurrentYear: number
    readOnly?: boolean
    userId?: string
    ownerName?: string
}

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

const TABS = ["Income", "Expenses", "Capital"] as const
type Tab = typeof TABS[number]

export function MonthlySheetClient({
    sheet,
    categories,
    capitalCategories,
    allSheets,
    month,
    year,
    isCurrentMonth,
    isFuture,
    serverCurrentMonth,
    serverCurrentYear,
    readOnly = false,
    userId,
    ownerName,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("Income")

    const isActualCurrentMonth = month === serverCurrentMonth && year === serverCurrentYear

    const income = sheet?.transactions.filter(t => t.type === "INCOME") ?? []
    const expenses = sheet?.transactions.filter(t => t.type === "EXPENSE") ?? []
    const incomeCategories = categories.filter(c => c.type === "INCOME")
    const expenseCategories = categories.filter(c => c.type === "EXPENSE")
    const transactionCount = sheet?.transactions.length ?? 0
    const capitalCount = sheet?.capitals.length ?? 0
    const hasData = transactionCount > 0 || capitalCount > 0

    return (
            <div className="p-6 max-w-6xl mx-auto space-y-6 pb-36 lg:pb-6">

                {/* Month picker */}
                <div className="mb-6 w-full">
                    <MonthPicker
                        allSheets={allSheets}
                        currentMonth={month}
                        currentYear={year}
                        userId={userId}
                        isActualCurrentMonth={isActualCurrentMonth}
                    />
                </div>

                {/* Desktop Tabs (hidden on mobile) */}
                <div className="hidden lg:grid grid-cols-3 gap-x-2 mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                                ${activeTab === tab
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {(isFuture && !hasData) ? (
                    <div className="bg-card rounded-xl p-10 shadow-sm border border-border text-center">
                        <p className="text-lg font-medium text-foreground mb-1">
                            This month has not happened yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {MONTH_NAMES[month - 1]} {year} is in the future - no sheet exists yet.
                        </p>
                        <Link href={userId ? `/shared/${userId}/monthly-sheet` : "/monthly-sheet"}
                            className="inline-block mt-4 text-sm text-blue-500 hover:text-blue-400 hover:underline transition-colors">
                            Go to current month
                        </Link>
                    </div>
                ) : !sheet ? (
                    <div className="bg-card rounded-xl p-10 shadow-sm border border-border text-center text-muted-foreground">
                        <p className="text-lg font-medium text-foreground mb-1">No data for this month</p>
                        <p className="text-sm">
                            {userId ? "This user did not have" : "You did not have"} an active sheet in {MONTH_NAMES[month - 1]} {year}.
                        </p>
                        <Link href={userId ? `/shared/${userId}/monthly-sheet` : "/monthly-sheet"}
                            className="inline-block mt-4 text-sm text-blue-500 hover:text-blue-400 hover:underline transition-colors">
                            Go to current month
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeTab === "Income" && (
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
                                {!readOnly && (
                                    <AddTransactionForm
                                        type="INCOME"
                                        sheetId={sheet.id}
                                        categories={incomeCategories}
                                        month={month}
                                        year={year}
                                        isShared={!!userId}
                                    />
                                )}
                                <TransactionList
                                    transactions={income}
                                    categories={incomeCategories}
                                    emptyMessage="No income recorded this month."
                                    month={month}
                                    year={year}
                                    sheetId={sheet.id}
                                    readOnly={readOnly}
                                    isShared={!!userId}
                                />
                            </div>
                        )}
                        {activeTab === "Expenses" && (
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
                                {!readOnly && (
                                    <AddTransactionForm
                                        type="EXPENSE"
                                        sheetId={sheet.id}
                                        categories={expenseCategories}
                                        month={month}
                                        year={year}
                                        isShared={!!userId}
                                    />
                                )}
                                <TransactionList
                                    transactions={expenses}
                                    categories={expenseCategories}
                                    emptyMessage="No expenses recorded this month."
                                    month={month}
                                    year={year}
                                    sheetId={sheet.id}
                                    readOnly={readOnly}
                                    isShared={!!userId}
                                />
                            </div>
                        )}
                        {activeTab === "Capital" && (
                            <Overview
                                capitals={sheet.capitals}
                                capitalCategories={capitalCategories}
                                sheetId={sheet.id}
                                readOnly={readOnly}
                                isShared={!!userId}
                            />
                        )}
                    </div>
                )}

                {/* Mobile Tab Bar */}
                <MobileTabBar activeTab={activeTab} onChange={setActiveTab} />
            </div>
    )
}

// Mobile Bottom Tab Bar Component
function MobileTabBar({ activeTab, onChange }: { activeTab: Tab; onChange: (t: Tab) => void }) {
    return (
        <div className="lg:hidden fixed bottom-[120px] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[400px]">
            <div className="bg-card/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl p-1 flex gap-1">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => onChange(tab)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                            ${activeTab === tab
                                ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                                : "text-muted-foreground hover:bg-muted/60"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    )
}

type FormMode = "normal" | "recurring" | "split"

function AddTransactionForm({ type, sheetId, categories, month, year, isShared = false }: {
    type: "INCOME" | "EXPENSE"
    sheetId: string
    categories: Category[]
    month: number
    year: number
    isShared?: boolean
}) {
    const [normalState, normalAction, normalPending] = useActionState(createTransaction, null)
    const [splitState, splitAction, splitPending] = useActionState(createSplitTransaction, null)
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<FormMode>("normal")
    const [splitMonths, setSplitMonths] = useState(3)

    const isPending = normalPending || splitPending
    const state = mode === "split" ? splitState : normalState

    useEffect(() => {
        if (normalState?.success || splitState?.success) setIsOpen(false)
    }, [normalState, splitState])

    // Date limits locked to this sheet's month
    const minDate = `${year}-${String(month).padStart(2, "0")}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const maxDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    const today = new Date().toISOString().split("T")[0]
    const defaultDate = today >= minDate && today <= maxDate ? today : maxDate
    const handleClose = () => { setIsOpen(false); setMode("normal") }
    const formAction = mode === "split" ? splitAction : normalAction

    if (!isOpen) {
        return (
            <div className="lg:static fixed bottom-[152px] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[400px] lg:w-full lg:max-w-none lg:px-0 lg:bottom-auto lg:z-auto lg:translate-x-0">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-primary text-primary-foreground lg:bg-transparent lg:text-muted-foreground border-2 border-dashed border-border lg:hover:border-muted-foreground/50 lg:hover:text-foreground rounded-2xl lg:rounded-xl py-3 text-xs font-semibold lg:font-medium transition-all shadow-lg lg:shadow-none active:scale-95 lg:active:scale-100"
                >
                    + Add {type === "INCOME" ? "Income" : "Expense"}
                </button>
            </div>
        )
    }

    // Shared fields rendered in both shells
    const fields = (
        <>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="monthlySheetId" value={sheetId} />

            <div className="flex gap-1.5 p-1 bg-muted rounded-xl w-fit">
                {(["normal", "recurring", ...(type === "EXPENSE" ? ["split"] : [])] as FormMode[]).map(m => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors capitalize
                            ${mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        {m === "recurring" && <RefreshCw className="size-3" />}
                        {m === "split" && <Scissors className="size-3" />}
                        {m}
                    </button>
                ))}
            </div>

            {/* Mode description hints */}
            {mode === "recurring" && (
                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
                    🔄 This transaction will auto-repeat every month.
                </p>
            )}
            {mode === "split" && (
                <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-1.5">
                    ✂️ Total amount will be split evenly across {splitMonths} months.
                </p>
            )}

            <div className={`grid gap-3 ${mode === "split" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-medium">
                        {mode === "split" ? "Total Amount (€)" : "Amount (€)"}
                    </label>
                    <input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required
                        className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-medium">Date</label>
                    <input name="date" type="date" min={minDate} max={maxDate} defaultValue={defaultDate} required
                        className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                {mode === "split" && (
                    <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-muted-foreground mb-1 block font-medium">Months</label>
                        <input name="splitMonths" type="number" min="2" max="24" value={splitMonths}
                            onChange={e => setSplitMonths(parseInt(e.target.value) || 2)}
                            className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                )}
            </div>

            {mode === "recurring" && <input type="hidden" name="isRecurring" value="true" />}

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    {!isShared && <CategoryManager type={type} categories={categories} />}
                </div>
                <select name="categoryId" required
                    className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select a category...</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-background">{c.icon} {c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Description (optional)</label>
                <input name="description" type="text" placeholder="e.g. Grocery run"
                    className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {state?.error && <p className="text-destructive text-xs font-medium">{state.error}</p>}

            <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
                    <Check className="size-3.5" />
                    {isPending ? "Saving..." : mode === "split" ? `Split into ${splitMonths} months` : "Save"}
                </button>
                <button type="button" onClick={handleClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <XCircle className="size-3.5" />
                    Cancel
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* MOBILE: bottom sheet */}
            <div className="lg:hidden">
                <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm" onClick={handleClose} />
                <div className="fixed inset-x-0 bottom-0 z-[101] bg-card border-t border-border rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                    <form action={formAction} className="p-6 space-y-3">
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5" />
                        <p className="text-base font-semibold text-foreground mb-1">
                            Add {type === "INCOME" ? "Income" : "Expense"}
                        </p>
                        {fields}
                    </form>
                </div>
            </div>

            {/* DESKTOP: inline card */}
            <form action={formAction} className="hidden lg:block bg-muted/50 border border-border rounded-xl p-4 space-y-3">
                {fields}
            </form>
        </>
    )
}

function TransactionList({ transactions, categories, emptyMessage, month, year, sheetId, readOnly, isShared }: {
    transactions: Transaction[]
    categories: Category[]
    emptyMessage: string
    month: number
    year: number
    sheetId: string
    readOnly?: boolean
    isShared?: boolean
}) {
    const [editingId, setEditingId] = useState<string | null>(null)

    if (transactions.length === 0) {
        return <p className="text-muted-foreground text-sm py-4">{emptyMessage}</p>
    }

    return (
        <ul className="divide-y divide-border">
            {transactions.map(t => (
                <li key={t.id}>
                    {editingId === t.id ? (
                        <EditTransactionRow
                            transaction={t}
                            categories={categories}
                            month={month}
                            year={year}
                            sheetId={sheetId}
                            onDone={() => setEditingId(null)}
                            isShared={isShared}
                        />
                    ) : (
                        <TransactionRow
                            transaction={t}
                            onEdit={() => setEditingId(t.id)}
                            readOnly={readOnly}
                        />
                    )}
                </li>
            ))}
        </ul>
    )
}

// Read-only transaction row
function TransactionRow({ transaction: t, onEdit, readOnly }: {
    transaction: Transaction
    onEdit: () => void
    readOnly?: boolean
}) {
    const isSplit = !!t.splitGroupId
    const [recurringPending, setRecurringPending] = useState(false)

    const handleToggleRecurring = async () => {
        if (recurringPending) return
        setRecurringPending(true)
        await toggleRecurring(t.id)
        setRecurringPending(false)
    }

    const isIncome = t.type === "INCOME"
    const txDate = new Date(t.date)
    const hasUniqueDesc = t.description && t.description !== t.category.name

    return (
        <div className="py-3 flex items-center justify-between gap-2">
            {/* Left: icon bubble + text */}
            <div className="flex items-center gap-2 min-w-0">
                <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0"
                    style={{
                        backgroundColor: isIncome ? "#EAF3DE" : "#FCEBEB",
                        color: isIncome ? "#3B6D11" : "#A32D2D",
                    }}
                >
                    {t.category.icon ?? (isIncome ? "↑" : "↓")}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                            {t.description || t.category.name}
                        </p>
                        {/* Recurring badge */}
                        {t.isRecurring && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <RefreshCw className="size-2.5" /> recurring
                            </span>
                        )}
                        {/* Split badge */}
                        {isSplit && t.splitIndex && t.splitMonths && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <Scissors className="size-2.5" /> {t.splitIndex}/{t.splitMonths}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {hasUniqueDesc ? `${t.category.name} · ` : ""}
                        {txDate.toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                    </p>
                </div>
            </div>

            {/* Right: amount + action buttons */}
            <div className="flex items-center gap-2 shrink-0">
                <span
                    className="text-sm font-medium"
                    style={{ color: isIncome ? "#529E19" : "#C83232" }}
                >
                    {isIncome ? "+" : "-"}€{t.amount.toFixed(2)}
                </span>
                {!readOnly && (
                    <>
                        {/* Toggle recurring button (only for non-split transactions) */}
                        {!isSplit && (
                            <button
                                onClick={handleToggleRecurring}
                                disabled={recurringPending}
                                title={t.isRecurring ? "Stop recurring" : "Make recurring"}
                                className={`transition-colors disabled:opacity-40 ${
                                    t.isRecurring
                                        ? "text-blue-500 hover:text-muted-foreground/40"
                                        : "text-muted-foreground/40 hover:text-blue-500"
                                }`}
                            >
                                <RefreshCw className="size-4" />
                            </button>
                        )}
                        <button
                            onClick={onEdit}
                            className="text-muted-foreground/40 hover:text-blue-500 transition-colors"
                            title="Edit"
                        >
                            <Pencil className="size-4" />
                        </button>
                        <DeleteButton transaction={t} />
                    </>
                )}
            </div>
        </div>
    )
}

// Inline edit row
function EditTransactionRow({ transaction: t, categories, month, year, sheetId, onDone, isShared }: {
    transaction: Transaction
    categories: Category[]
    month: number
    year: number
    sheetId: string
    onDone: () => void
    isShared?: boolean
}) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const minDate = `${year}-${String(month).padStart(2, "0")}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const maxDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

    return (
        <form
            action={async (fd) => {
                setError(null)
                setIsPending(true)
                fd.append("monthlySheetId", sheetId)
                fd.append("type", t.type)
                const result = await updateTransaction(t.id, fd)
                setIsPending(false)
                if (result?.success) onDone()
                else if (result?.error) setError(result.error)
            }}
            className="py-3 px-3 my-1 space-y-2 bg-muted/50 border border-border rounded-xl"
        >
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Amount (€)</label>
                    <input name="amount" type="number" step="0.01" min="0.01"
                        defaultValue={t.amount} required
                        className="w-full border border-input bg-background text-foreground rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <input name="date" type="date" min={minDate} max={maxDate}
                        defaultValue={new Date(t.date).toISOString().split("T")[0]} required
                        className="w-full border border-input bg-background text-foreground rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    {!isShared && <CategoryManager type={t.type as "INCOME" | "EXPENSE"} categories={categories} />}
                </div>
                <select name="categoryId" defaultValue={t.categoryId} required
                    className="w-full border border-input bg-background text-foreground rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-background">{c.icon} {c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                <input name="description" type="text" defaultValue={t.description ?? ""}
                    placeholder="e.g. Grocery run"
                    className="w-full border border-input bg-background text-foreground rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {error && <p className="text-destructive text-xs">{error}</p>}

            <div className="flex gap-2">
                <button type="submit" disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
                    <Check className="size-3.5" />
                    {isPending ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={onDone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <XCircle className="size-3.5" />
                    Cancel
                </button>
            </div>
        </form>
    )
}

function DeleteButton({ transaction }: { transaction: Transaction }) {
    const [isPending, setIsPending] = useState(false)
    const [showSplitDialog, setShowSplitDialog] = useState(false)

    const handleDelete = async () => {
        if (isPending) return

        // If it is a split, show choice dialog
        if (transaction.splitGroupId) {
            setShowSplitDialog(true)
            return
        }

        if (!confirm("Delete this transaction?")) return
        setIsPending(true)
        await deleteTransaction(transaction.id)
    }

    const handleDeleteOne = async () => {
        setIsPending(true)
        setShowSplitDialog(false)
        await deleteTransaction(transaction.id)
    }

    const handleDeleteAll = async () => {
        setIsPending(true)
        setShowSplitDialog(false)
        await deleteSplitGroup(transaction.splitGroupId!)
    }

    return (
        <>
            <button onClick={handleDelete} disabled={isPending}
                className="text-muted-foreground/40 hover:text-destructive disabled:opacity-30 transition-colors">
                <Trash2 className="size-4" />
            </button>

            {showSplitDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <h3 className="font-semibold text-base mb-2">Delete split transaction</h3>
                        <p className="text-sm text-muted-foreground mb-5">
                            This is part <span className="font-medium text-foreground">{transaction.splitIndex}/{transaction.splitMonths}</span> of a split.
                            Do you want to delete just this part, or all {transaction.splitMonths} parts?
                        </p>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleDeleteOne} disabled={isPending}
                                className="w-full border border-border rounded-xl px-4 py-2 text-sm font-medium hover:bg-muted transition-colors text-foreground">
                                Delete only this part ({transaction.splitIndex}/{transaction.splitMonths})
                            </button>
                            <button onClick={handleDeleteAll} disabled={isPending}
                                className="w-full bg-destructive text-destructive-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                                Delete all {transaction.splitMonths} parts
                            </button>
                            <button onClick={() => setShowSplitDialog(false)} disabled={isPending}
                                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Overview (actually just capital)
function Overview({ capitals, capitalCategories, sheetId, readOnly = false, isShared = false }: {
    capitals: Capital[]
    capitalCategories: CapitalCategory[]
    sheetId: string
    readOnly?: boolean
    isShared?: boolean
}) {

    const totalCapital = capitals.reduce((sum, c) => sum + c.amount, 0)

    return (
        <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
                {!readOnly && (
                    <AddCapitalForm
                        sheetId={sheetId}
                        capitalCategories={capitalCategories}
                        existingCategoryIds={capitals.map(c => c.capitalCategoryId)}
                        isShared={isShared}
                    />
                )}
                <CapitalList
                    capitals={capitals}
                    sheetId={sheetId}
                    totalCapital={totalCapital}
                    readOnly={readOnly}
                />
            </div>
        </div>
    )
}

function MonthPicker({ allSheets, currentMonth, currentYear, userId, isActualCurrentMonth }: {
    allSheets: { month: number; year: number }[]
    currentMonth: number
    currentYear: number
    userId?: string
    isActualCurrentMonth?: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [viewYear, setViewYear] = useState(currentYear)

    const today = new Date()
    const thisMonth = today.getMonth() + 1
    const thisYear = today.getFullYear()

    useEffect(() => {
        if (!isOpen) {
            setViewYear(currentYear)
        }
    }, [isOpen, currentYear])

    const hasSheet = (m: number, y: number) => 
        allSheets.some(s => s.month === m && s.year === y)

    return (
        <div className="relative w-full">
            <button 
                onClick={() => setIsOpen(prev => !prev)}
                className="group flex items-center justify-center gap-x-4 w-full px-4 py-3 rounded-2xl bg-card border border-border hover:bg-muted active:bg-muted/50 transition-all focus:outline-none shadow-sm"
            >
                <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <CalendarIcon className="size-5 text-primary" />
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-xl font-bold text-foreground tabular-nums">
                            {MONTH_NAMES[currentMonth - 1]} {currentYear}
                        </span>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                </div>
                {isActualCurrentMonth && (
                    <span className="text-xs font-normal bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-xl border border-blue-500/20">
                        Current
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-[100] lg:z-10 bg-background/60 backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent" 
                        onClick={() => setIsOpen(false)} 
                    />

                    {/* Picker Container*/}
                    <div className="fixed inset-x-0 bottom-0 z-[101] lg:absolute lg:inset-auto lg:left-1/2 lg:-translate-x-1/2 lg:top-full lg:mt-2 w-full lg:w-80 bg-card border-t lg:border border-border shadow-[0_-8px_30px_rgb(0,0,0,0.12)] lg:shadow-xl rounded-t-[2.5rem] lg:rounded-2xl p-6 lg:p-4 animate-in slide-in-from-bottom lg:slide-in-from-top-2 lg:fade-in duration-300 lg:duration-200">
                        
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 lg:hidden" />

                        <div className="flex items-center justify-between mb-6 lg:mb-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setViewYear(v => v - 1) }}
                                className="p-3 lg:p-1.5 hover:bg-muted rounded-xl transition-colors"
                            >
                                <ChevronLeft className="size-5 lg:size-4" />
                            </button>
                            <span className="font-bold text-lg lg:text-sm tabular-nums">{viewYear}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setViewYear(v => v + 1) }}
                                className="p-3 lg:p-1.5 hover:bg-muted rounded-xl transition-colors"
                            >
                                <ChevronRight className="size-5 lg:size-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 lg:gap-2">
                            {MONTH_NAMES.map((name, index) => {
                                const m = index + 1
                                const isSelected = currentMonth === m && currentYear === viewYear
                                const isToday = thisMonth === m && thisYear === viewYear
                                const exists = hasSheet(m, viewYear)
                                
                                const href = userId
                                    ? `/shared/${userId}/monthly-sheet?month=${m}&year=${viewYear}`
                                    : `/monthly-sheet?month=${m}&year=${viewYear}`

                                return (
                                    <Link
                                        key={name}
                                        href={href}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                                            relative py-5 lg:py-3 rounded-2xl lg:rounded-xl text-sm lg:text-xs font-semibold flex flex-col items-center justify-center transition-all active:scale-95
                                            ${isSelected 
                                                ? "bg-primary text-primary-foreground shadow-lg lg:shadow-sm" 
                                                : "bg-muted/30 lg:bg-transparent hover:bg-muted text-foreground"
                                            }
                                            ${!exists && !isSelected ? "opacity-30" : "opacity-100"}
                                        `}
                                    >
                                        {name.substring(0, 3)}
                                        <div className="absolute bottom-2 lg:bottom-1.5 flex gap-1">
                                            {isToday && (
                                                <span className={`size-1.5 lg:size-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-blue-500"}`} />
                                            )}
                                            {exists && !isSelected && (
                                                <span className="size-1.5 lg:size-1 rounded-full bg-muted-foreground/40" />
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>

                        <div className="mt-6 lg:mt-4 pt-6 lg:pt-4 border-t border-border flex flex-col items-center gap-4">
                            <Link 
                                href={userId ? `/shared/${userId}/monthly-sheet` : "/monthly-sheet"}
                                onClick={() => setIsOpen(false)}
                                className="w-full lg:w-auto min-w-[160px] text-center px-6 py-3 lg:py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-2xl lg:rounded-xl transition-all active:scale-95"
                            >
                                Go to Current Month
                            </Link>
                            
                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-blue-500" /> Today
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-muted-foreground/40" /> Recorded Data
                                </span>
                            </div>

                            <button 
                                onClick={() => setIsOpen(false)}
                                className="lg:hidden text-xs font-bold text-muted-foreground/60 uppercase tracking-widest pt-2"
                            >
                                Close Picker
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function AddCapitalForm({ sheetId, capitalCategories, existingCategoryIds, isShared = false }: {
    sheetId: string
    capitalCategories: CapitalCategory[]
    existingCategoryIds: string[]
    isShared?: boolean
}) {
    const [state, formAction, isPending] = useActionState(createCapital, null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (state?.success) setIsOpen(false)
    }, [state])

    const available = capitalCategories.filter(c => !existingCategoryIds.includes(c.id))

    if (!isOpen) {
        return (
            <div className="lg:static fixed bottom-[152px] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[400px] lg:w-full lg:max-w-none lg:px-0 lg:bottom-auto lg:z-auto lg:translate-x-0">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-primary text-primary-foreground lg:bg-transparent lg:text-muted-foreground border-2 border-dashed border-border lg:hover:border-muted-foreground/50 lg:hover:text-foreground rounded-2xl lg:rounded-xl py-3 text-xs font-semibold lg:font-medium transition-all shadow-lg lg:shadow-none active:scale-95 lg:active:scale-100"
                >
                    + Add Capital Entry
                </button>
            </div>
        )
    }

    const fields = (
        <>
            <input type="hidden" name="monthlySheetId" value={sheetId} />

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    {!isShared && <CapitalCategoryManager categories={capitalCategories} />}
                </div>
                <select name="capitalCategoryId" required
                    className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select a category...</option>
                    {available.map(c => (
                        <option key={c.id} value={c.id} className="bg-background">{c.name}</option>
                    ))}
                </select>
                {available.length === 0 && (
                    <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                        All categories already have an entry this month.
                    </p>
                )}
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Amount (€)</label>
                <input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required
                    className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {state?.error && <p className="text-destructive text-xs font-medium">{state.error}</p>}

            <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
                    <Check className="size-3.5" />
                    {isPending ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <XCircle className="size-3.5" />
                    Cancel
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* MOBILE: bottom sheet */}
            <div className="lg:hidden">
                <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                <div className="fixed inset-x-0 bottom-0 z-[101] bg-card border-t border-border rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                    <form action={formAction} className="p-6 space-y-3">
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5" />
                        <p className="text-base font-semibold text-foreground mb-1">Add Capital Entry</p>
                        {fields}
                    </form>
                </div>
            </div>

            {/* DESKTOP: inline card */}
            <form action={formAction} className="hidden lg:block bg-muted/50 border border-border rounded-xl p-4 space-y-3">
                {fields}
            </form>
        </>
    )
}

function CapitalList({ capitals, sheetId, totalCapital, readOnly = false }: {
    capitals: Capital[]
    sheetId: string
    totalCapital: number
    readOnly?: boolean
}) {
    const [editingId, setEditingId] = useState<string | null>(null)

    if (capitals.length === 0) {
        return <p className="text-muted-foreground text-sm py-4">No capital entries this month.</p>
    }

    return (
        <div className="space-y-0">
            <ul className="divide-y divide-border">
                {capitals.map(c => (
                    <CapitalRow
                        key={c.id}
                        capital={c}
                        isEditing={editingId === c.id}
                        onEdit={() => setEditingId(c.id)}
                        onDone={() => setEditingId(null)}
                        totalCapital={totalCapital}
                        readOnly={readOnly}
                    />
                ))}
            </ul>

            {totalCapital > 0 && (
                <div className="flex items-center justify-between pt-5 mt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        Total net worth
                    </div>
                    <span className="font-semibold text-foreground">
                        €{totalCapital.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            )}
        </div>
    )
}

function CapitalRow({ capital, isEditing, onEdit, onDone, totalCapital, readOnly = false }: {
    capital: Capital
    isEditing: boolean
    onEdit: () => void
    onDone: () => void
    totalCapital: number
    readOnly?: boolean
}) {
    return (
        <li>
            {isEditing ? (
                <EditCapitalRow capital={capital} onDone={onDone} />
            ) : (
                <div className="py-3 flex items-center gap-2 group">
                    <div className="flex-1 flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-xl shrink-0"
                            style={{ backgroundColor: capital.capitalCategory.color }}
                        />
                        <p className="font-medium text-foreground text-sm">
                            {capital.capitalCategory.name}
                        </p>
                    </div>
                    {totalCapital > 0 && (
                        <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                            {((capital.amount / totalCapital) * 100).toFixed(1)}%
                        </span>
                    )}
                    <span className="font-semibold text-blue-600 dark:text-blue-400 w-20 text-right shrink-0">
                        €{capital.amount.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {!readOnly && (
                        <>
                            <button onClick={onEdit} className="text-muted-foreground/40 hover:text-blue-500 transition-colors">
                                <Pencil className="size-4" />
                            </button>
                            <DeleteCapitalButton capitalId={capital.id} />
                        </>
                    )}
                </div>
            )}
        </li>
    )
}

function EditCapitalRow({ capital, onDone }: { capital: Capital; onDone: () => void }) {
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    return (
        <form
            action={async (fd) => {
                setError(null)
                setIsPending(true)
                const result = await updateCapital(capital.id, fd)
                setIsPending(false)
                if (result?.success) onDone()
                else if (result?.error) setError(result.error)
            }}
            className="py-3 px-3 my-1 space-y-2 bg-muted/50 border border-border rounded-xl"
        >
            <p className="text-sm font-medium text-foreground">
                {capital.capitalCategory.name}
            </p>
            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (€)</label>
                <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={capital.amount}
                    required
                    className="w-full border border-input bg-background text-foreground rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
                    <Check className="size-3.5" /> {isPending ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={onDone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <XCircle className="size-3.5" /> Cancel
                </button>
            </div>
        </form>
    )
}

function DeleteCapitalButton({ capitalId }: { capitalId: string }) {
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (isPending) return
        if (!confirm("Delete this capital entry?")) return
        setIsPending(true)
        await deleteCapital(capitalId)
    }

    return (
        <button onClick={handleDelete} disabled={isPending}
            className="text-muted-foreground/40 hover:text-destructive disabled:opacity-30 transition-colors">
            <Trash2 className="size-4" />
        </button>
    )
}