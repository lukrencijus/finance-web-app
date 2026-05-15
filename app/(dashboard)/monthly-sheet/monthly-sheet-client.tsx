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

    return (
        <div className="-mt-24 pb-10">
            <div className="max-w-screen-2xl mx-auto px-4">

                {/* Month picker */}
                <div className="flex items-center gap-x-3 mb-6">
                    <MonthPicker
                        allSheets={allSheets}
                        currentMonth={month}
                        currentYear={year}
                        readOnly={readOnly}
                        userId={userId}
                    />
                    {isActualCurrentMonth && (
                        <span className="text-xs font-normal bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/10">
                            Current
                        </span>
                    )}
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-x-2 mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                                ${activeTab === tab
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {isFuture ? (
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

    if (!isOpen) {
        return (
            <div className="lg:static fixed bottom-[72px] left-0 right-0 px-4 z-40 lg:px-0 lg:bottom-auto lg:z-auto">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full border-2 border-dashed border-border rounded-lg py-4 lg:py-3 text-sm font-medium text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors bg-card/95 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none shadow-lg lg:shadow-none"
                >
                    + Add {type === "INCOME" ? "Income" : "Expense"}
                </button>
            </div>
        )
    }

    const formAction = mode === "split" ? splitAction : normalAction

    return (
        <form action={formAction} className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="monthlySheetId" value={sheetId} />

            {/* Mode selector */}
            <div className="flex gap-1.5 p-1 bg-muted rounded-lg w-fit">
                {(["normal", "recurring", ...(type === "EXPENSE" ? ["split"] : [])] as FormMode[]).map(m => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize
                            ${mode === m
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {m === "recurring" && <RefreshCw className="size-3" />}
                        {m === "split" && <Scissors className="size-3" />}
                        {m}
                    </button>
                ))}
            </div>

            {/* Mode description hints */}
            {mode === "recurring" && (
                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-md px-3 py-1.5">
                    🔄 This transaction will auto-repeat every month.
                </p>
            )}
            {mode === "split" && (
                <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-md px-3 py-1.5">
                    ✂️ Total amount will be split evenly across {splitMonths} months.
                </p>
            )}

            <div className={`grid gap-3 ${mode === "split" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-medium">
                        {mode === "split" ? "Total Amount (€)" : "Amount (€)"}
                    </label>
                    <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        required
                        className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block font-medium">Date</label>
                    <input
                        name="date"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        defaultValue={defaultDate}
                        required
                        className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                {mode === "split" && (
                    <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-muted-foreground mb-1 block font-medium">Months</label>
                        <input
                            name="splitMonths"
                            type="number"
                            min="2"
                            max="24"
                            value={splitMonths}
                            onChange={e => setSplitMonths(parseInt(e.target.value) || 2)}
                            className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                )}
            </div>

            {/* Hidden recurring flag */}
            {mode === "recurring" && (
                <input type="hidden" name="isRecurring" value="true" />
            )}

            {/* Category */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    {!isShared && <CategoryManager type={type} categories={categories} />}
                </div>
                <select
                    name="categoryId"
                    required
                    className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">Select a category...</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-background">
                            {c.icon} {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Description (optional)</label>
                <input
                    name="description"
                    type="text"
                    placeholder="e.g. Grocery run"
                    className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {state?.error && (
                <p className="text-destructive text-xs font-medium">{state.error}</p>
            )}

            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                    <Check className="size-3.5" />
                    {isPending ? "Saving..." : mode === "split" ? `Split into ${splitMonths} months` : "Save"}
                </button>
                <button
                    type="button"
                    onClick={() => { setIsOpen(false); setMode("normal") }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                    <XCircle className="size-3.5" />
                    Cancel
                </button>
            </div>
        </form>
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

    return (
        <div className="py-3 flex justify-between items-center gap-2">
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-foreground">
                        {t.category.icon} {t.category.name}
                    </p>
                    {/* Recurring badge */}
                    {t.isRecurring && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <RefreshCw className="size-2.5" /> recurring
                        </span>
                    )}
                    {/* Split badge */}
                    {isSplit && t.splitIndex && t.splitMonths && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Scissors className="size-2.5" /> {t.splitIndex}/{t.splitMonths}
                        </span>
                    )}
                </div>
                {t.description && (
                    <p className="text-sm text-muted-foreground truncate">{t.description}</p>
                )}
                <p className="text-xs text-muted-foreground/60">
                    {new Date(t.date).toISOString().split("T")[0]}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className={`font-semibold ${t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {t.type === "INCOME" ? "+" : "-"}€{t.amount.toFixed(2)}
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
            className="py-3 px-3 my-1 space-y-2 bg-muted/50 border border-border rounded-lg"
        >
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Amount (€)</label>
                    <input name="amount" type="number" step="0.01" min="0.01"
                        defaultValue={t.amount} required
                        className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <input name="date" type="date" min={minDate} max={maxDate}
                        defaultValue={new Date(t.date).toISOString().split("T")[0]} required
                        className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    {!isShared && <CategoryManager type={t.type as "INCOME" | "EXPENSE"} categories={categories} />}
                </div>
                <select name="categoryId" defaultValue={t.categoryId} required
                    className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-background">{c.icon} {c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                <input name="description" type="text" defaultValue={t.description ?? ""}
                    placeholder="e.g. Grocery run"
                    className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {error && <p className="text-destructive text-xs">{error}</p>}

            <div className="flex gap-2">
                <button type="submit" disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
                    <Check className="size-3.5" />
                    {isPending ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={onDone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
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
                                className="w-full border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-muted transition-colors text-foreground">
                                Delete only this part ({transaction.splitIndex}/{transaction.splitMonths})
                            </button>
                            <button onClick={handleDeleteAll} disabled={isPending}
                                className="w-full bg-destructive text-destructive-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
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

function MonthPicker({ allSheets, currentMonth, currentYear, readOnly, userId }: {
    allSheets: SheetSummary[]
    currentMonth: number
    currentYear: number
    readOnly?: boolean
    userId?: string
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-x-2 text-2xl font-semibold text-white hover:text-white/80 transition-colors focus:outline-none">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
                <ChevronDown className={`size-5 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-20 bg-card rounded-xl shadow-lg border border-border overflow-hidden min-w-48 animate-in fade-in zoom-in-95 duration-100">
                        {allSheets.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-muted-foreground">No sheets yet</p>
                        ) : (
                            <ul>
                                {allSheets.map(s => {
                                    const isActive = s.month === currentMonth && s.year === currentYear

                                    const href = userId
                                        ? `/shared/${userId}/monthly-sheet?month=${s.month}&year=${s.year}`
                                        : `/monthly-sheet?month=${s.month}&year=${s.year}`

                                    return (
                                        <li key={`${s.year}-${s.month}`}>
                                            <Link href={href} onClick={() => setIsOpen(false)}
                                                className={`block w-full px-4 py-2.5 text-sm transition-colors
                                                    ${isActive
                                                        ? "bg-muted font-semibold text-foreground"
                                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                    }`}>
                                                {MONTH_NAMES[s.month - 1]} {s.year}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
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
            <div className="lg:static fixed bottom-[72px] left-0 right-0 px-4 z-40 lg:px-0 lg:bottom-auto lg:z-auto">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full border-2 border-dashed border-border rounded-lg py-4 lg:py-3 text-sm font-medium text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors bg-card/95 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none shadow-lg lg:shadow-none"
                >
                    + Add Capital Entry
                </button>
            </div>
        )
    }

    return (
        <form action={formAction} className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <input type="hidden" name="monthlySheetId" value={sheetId} />

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    {!isShared && <CapitalCategoryManager categories={capitalCategories} />}
                </div>
                <select
                    name="capitalCategoryId"
                    required
                    className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">Select a category...</option>
                    {available.map(c => (
                        <option key={c.id} value={c.id} className="bg-background">
                            {c.name}
                        </option>
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
                <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    required
                    className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {state?.error && <p className="text-destructive text-xs font-medium">{state.error}</p>}

            <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
                    <Check className="size-3.5" />
                    {isPending ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                    <XCircle className="size-3.5" />
                    Cancel
                </button>
            </div>
        </form>
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
                            className="w-3 h-3 rounded-full shrink-0"
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
            className="py-3 px-3 my-1 space-y-2 bg-muted/50 border border-border rounded-lg"
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
                    className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
                    <Check className="size-3.5" /> {isPending ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={onDone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
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