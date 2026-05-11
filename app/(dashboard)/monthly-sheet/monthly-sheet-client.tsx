"use client"

import { useState, useEffect, useActionState } from "react"
import { createTransaction, deleteTransaction, updateTransaction, createCapital, updateCapital, deleteCapital } from "./actions"
import { Trash2, ChevronDown, Pencil, Check, XCircle, Eye } from "lucide-react"
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
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="-mt-24 pb-10">
            <div className="max-w-screen-2xl mx-auto px-4">

                {!!userId && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm">
                        <Eye className="size-4 shrink-0" />
                        <span>
                            You are viewing {ownerName ? `${ownerName}'s` : "a shared"} profile in {readOnly ? "read-only" : "edit"} mode
                        </span>
                    </div>
                )}

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
                <div className="flex gap-x-2 mb-6">
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
                            This month hasn't happened yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {MONTH_NAMES[month - 1]} {year} is in the future - no sheet exists yet.
                        </p>
                        <Link href={readOnly && userId ? `/shared/${userId}` : "/monthly-sheet" } className="inline-block mt-4 text-sm text-blue-500 hover:text-blue-400 hover:underline transition-colors">
                            Go to current month
                        </Link>
                    </div>
                ) : !sheet ? (
                    <div className="bg-card rounded-xl p-10 shadow-sm border border-border text-center text-muted-foreground">
                        <p className="text-lg font-medium text-foreground mb-1">No data for this month</p>
                        <p className="text-sm"> {readOnly ? "This user didn't have" : "You didn't have"} an active sheet in {MONTH_NAMES[month - 1]} {year}.</p>
                        <Link href={readOnly && userId ? `/shared/${userId}` : "/monthly-sheet" } className="inline-block mt-4 text-sm text-blue-500 hover:text-blue-400 hover:underline transition-colors">
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

// Add Transaction Form
function AddTransactionForm({ type, sheetId, categories, month, year, isShared = false }: {
    type: "INCOME" | "EXPENSE"
    sheetId: string
    categories: Category[]
    month: number
    year: number
    isShared?: boolean
}) {
    const [state, formAction, isPending] = useActionState(createTransaction, null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (state?.success) setIsOpen(false)
    }, [state])

    // Date limits locked to this sheet's month
    const minDate = `${year}-${String(month).padStart(2, "0")}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const maxDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    const today = new Date().toISOString().split("T")[0]
    const defaultDate = today >= minDate && today <= maxDate ? today : maxDate

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full border-2 border-dashed border-border rounded-lg py-3 text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
            >
                + Add {type === "INCOME" ? "Income" : "Expense"}
            </button>
        )
    }

    return (
        <form action={formAction} className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="monthlySheetId" value={sheetId} />

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Category select + manage button */}
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
                    {isPending ? "Saving..." : "Save"}
                </button>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
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
    return (
        <div className="py-3 flex justify-between items-center group">
            <div>
                <p className="font-medium text-foreground">
                    {t.category.icon} {t.category.name}
                </p>
                {t.description && (
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                )}
                <p className="text-xs text-muted-foreground/60">
                    {new Date(t.date).toISOString().split("T")[0]}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <span className={`font-semibold ${t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {t.type === "INCOME" ? "+" : "-"}€{t.amount.toFixed(2)}
                </span>
                {!readOnly && (
                    <>
                        <button
                            onClick={onEdit}
                            className="text-muted-foreground/40 hover:text-blue-500 transition-colors"
                            title="Edit"
                        >
                            <Pencil className="size-4" />
                        </button>
                        <DeleteButton transactionId={t.id} />
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
                // updateTransaction needs the sheetId to validate the date
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
                    <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={t.amount}
                        required
                        className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <input
                        name="date"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        defaultValue={new Date(t.date).toISOString().split("T")[0]}
                        required
                        className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    {!isShared && (
                        <CategoryManager
                            type={t.type as "INCOME" | "EXPENSE"}
                            categories={categories}
                        />
                    )}
                </div>
                <select
                    name="categoryId"
                    defaultValue={t.categoryId}
                    required
                    className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-background">
                            {c.icon} {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                <input
                    name="description"
                    type="text"
                    defaultValue={t.description ?? ""}
                    placeholder="e.g. Grocery run"
                    className="w-full border border-input bg-background text-foreground rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {error && <p className="text-destructive text-xs">{error}</p>}

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                    <Check className="size-3.5" />
                    {isPending ? "Saving..." : "Save"}
                </button>
                <button
                    type="button"
                    onClick={onDone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                    <XCircle className="size-3.5" />
                    Cancel
                </button>
            </div>
        </form>
    )
}

// Delete button
function DeleteButton({ transactionId }: { transactionId: string }) {
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (isPending) return  // guard double-click
        if (!confirm("Delete this transaction?")) return
        setIsPending(true)
        await deleteTransaction(transactionId)
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-muted-foreground/40 hover:text-destructive disabled:opacity-30 transition-colors"
        >
            <Trash2 className="size-4" />
        </button>
    )
}

// Overview
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

// Month Picker
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
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-x-2 text-2xl font-semibold text-white hover:text-white/80 transition-colors focus:outline-none"
            >
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

                                    const href = (readOnly && userId)
                                        ? `/shared/${userId}?month=${s.month}&year=${s.year}`
                                        : `/monthly-sheet?month=${s.month}&year=${s.year}`

                                    return (
                                        <li key={`${s.year}-${s.month}`}>
                                            <Link
                                                href={href}
                                                onClick={() => setIsOpen(false)}
                                                className={`block w-full px-4 py-2.5 text-sm transition-colors
                                                    ${isActive
                                                        ? "bg-muted font-semibold text-foreground"
                                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                    }`}
                                            >
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
            <button
                onClick={() => setIsOpen(true)}
                className="w-full border-2 border-dashed border-border rounded-lg py-3 text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
            >
                + Add Capital Entry
            </button>
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
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                            €{totalCapital.toLocaleString("en-IE", { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                            })}
                        </span>
                    </div>
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
                            <button onClick={onEdit}
                                className="text-muted-foreground/40 hover:text-blue-500 transition-colors">
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