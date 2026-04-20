"use client"

import { useState, useEffect, useActionState } from "react"
import { useRouter } from "next/navigation"
import { createTransaction, deleteTransaction } from "./actions"
import { Trash2, ChevronDown } from "lucide-react"
import Link from "next/link"

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
    category: { name: string; icon: string | null }
}

type Sheet = {
    id: string
    month: number
    year: number
    transactions: Transaction[]
}

type SheetSummary = { month: number; year: number }

type Props = {
    sheet: Sheet | null
    categories: Category[]
    allSheets: SheetSummary[]
    month: number
    year: number
    isCurrentMonth: boolean
    isFuture: boolean
    serverCurrentMonth: number
    serverCurrentYear: number
}

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

const TABS = ["Income", "Expenses", "Overview"] as const
type Tab = typeof TABS[number]

export function MonthlySheetClient({ sheet, categories, allSheets, month, year, isCurrentMonth, isFuture, serverCurrentMonth, serverCurrentYear }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("Income")
    const router = useRouter()

    const isActualCurrentMonth = month === serverCurrentMonth && year === serverCurrentYear

    const income = sheet?.transactions.filter(t => t.type === "INCOME") ?? []
    const expenses = sheet?.transactions.filter(t => t.type === "EXPENSE") ?? []
    const incomeCategories = categories.filter(c => c.type === "INCOME")
    const expenseCategories = categories.filter(c => c.type === "EXPENSE")
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    const balance = totalIncome - totalExpenses

    return (
        <div className="-mt-24 pb-10">
            <div className="max-w-screen-2xl mx-auto">

                {/* month picker */}
                <div className="flex items-center gap-x-3 mb-6">
                    <MonthPicker
                        allSheets={allSheets}
                        currentMonth={month}
                        currentYear={year}
                    />
                    {isActualCurrentMonth && (
                        <span className="text-xs font-normal bg-white/20 text-white px-2 py-0.5 rounded-full">
                            Current
                        </span>
                    )}
                </div>

                {/* tabs */}
                <div className="flex gap-x-2 mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                                ${activeTab === tab
                                    ? "bg-white text-gray-900"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {isFuture ? (
                    <div className="bg-white rounded-xl p-10 shadow-sm text-center">
                        <p className="text-lg font-medium text-gray-500 mb-1">
                            This month hasn't happened yet
                        </p>
                        <p className="text-sm text-gray-400">
                            {MONTH_NAMES[month - 1]} {year} is in the future - no sheet exists yet.
                        </p>
                        <Link
                            href="/monthly-sheet"
                            className="inline-block mt-4 text-sm text-blue-500 hover:underline"
                        >
                            Go to current month
                        </Link>
                    </div>
                ) : !sheet ? (
                    <div className="bg-white rounded-xl p-10 shadow-sm text-center text-gray-400">
                        <p className="text-lg font-medium text-gray-500 mb-1">No data for this month</p>
                        <p className="text-sm">You didn't have an active sheet in {MONTH_NAMES[month - 1]} {year}.</p>
                        <Link
                            href="/monthly-sheet"
                            className="inline-block mt-4 text-sm text-blue-500 hover:underline"
                        >
                            Go to current month
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        {activeTab === "Income" && (
                            <div className="space-y-6">
                                {sheet && (
                                    <AddTransactionForm
                                        type="INCOME"
                                        sheetId={sheet.id}
                                        categories={incomeCategories}
                                    />
                                )}
                                <TransactionList
                                    transactions={income}
                                    emptyMessage="No income recorded this month."
                                />
                            </div>
                        )}
                        {activeTab === "Expenses" && (
                            <div className="space-y-6">
                                {sheet && (
                                    <AddTransactionForm
                                        type="EXPENSE"
                                        sheetId={sheet.id}
                                        categories={expenseCategories}
                                    />
                                )}
                                <TransactionList
                                    transactions={expenses}
                                    emptyMessage="No expenses recorded this month."
                                />
                            </div>
                        )}
                        {activeTab === "Overview" && (
                            <Overview
                                totalIncome={totalIncome}
                                totalExpenses={totalExpenses}
                                balance={balance}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// Transaction Form
function AddTransactionForm({ type, sheetId, categories }: {
    type: "INCOME" | "EXPENSE"
    sheetId: string
    categories: Category[]
}) {
    const [state, formAction, isPending] = useActionState(createTransaction, null)
    const [isOpen, setIsOpen] = useState(false)

    // close form on success
    useEffect(() => {
        if (state?.success) setIsOpen(false)
    }, [state])

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
            >
                + Add {type === "INCOME" ? "Income" : "Expense"}
            </button>
        )
    }

    return (
        <form action={formAction} className="bg-gray-50 rounded-lg p-4 space-y-3">
            {/* hidden fields, pass context to the server */}
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="monthlySheetId" value={sheetId} />

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amount (€)</label>
                    <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        required
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                    <input
                        name="date"
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                        required
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select
                    name="categoryId"
                    required
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    <option value="">Select a category...</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-500 mb-1 block">Description (optional)</label>
                <input
                    name="description"
                    type="text"
                    placeholder="e.g. Grocery run"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
            </div>

            {state?.error && (
                <p className="text-red-500 text-xs">{state.error}</p>
            )}

            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    {isPending ? "Saving..." : "Save"}
                </button>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

// Transaction List
function TransactionList({ transactions, emptyMessage }: {
    transactions: Transaction[]
    emptyMessage: string
}) {
    if (transactions.length === 0) {
        return <p className="text-gray-400 text-sm">{emptyMessage}</p>
    }
    return (
        <ul className="divide-y divide-gray-100">
            {transactions.map(t => (
                <li key={t.id} className="py-3 flex justify-between items-center">
                    <div>
                        <p className="font-medium text-gray-800">
                            {t.category.icon} {t.category.name}
                        </p>
                        {t.description && (
                            <p className="text-sm text-gray-400">{t.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                            {new Date(t.date).toISOString().split("T")[0]}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`font-semibold ${
                            t.type === "INCOME" ? "text-green-600" : "text-red-500"
                        }`}>
                            {t.type === "INCOME" ? "+" : "-"}€{t.amount.toFixed(2)}
                        </span>
                        <DeleteButton transactionId={t.id} />
                    </div>
                </li>
            ))}
        </ul>
    )
}

// Separate component so isPending only affects this one row
function DeleteButton({ transactionId }: { transactionId: string }) {
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (!confirm("Delete this transaction?")) return
        setIsPending(true)
        await deleteTransaction(transactionId)
        setIsPending(false)
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors"
        >
            <Trash2 className="size-4" />
        </button>
    )
}

// Overview
function Overview({ totalIncome, totalExpenses, balance }: {
    totalIncome: number
    totalExpenses: number
    balance: number
}) {
    return (
        <div className="grid grid-cols-3 gap-4">
            <SummaryCard label="Income" amount={totalIncome} color="text-green-600" />
            <SummaryCard label="Expenses" amount={totalExpenses} color="text-red-500" />
            <SummaryCard
                label="Balance"
                amount={balance}
                color={balance >= 0 ? "text-blue-600" : "text-red-500"}
            />
        </div>
    )
}

function SummaryCard({ label, amount, color }: {
    label: string
    amount: number
    color: string
}) {
    return (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{label === "Balance" && amount < 0 ? "-" : ""}€{Math.abs(amount).toFixed(2)}</p>
        </div>
    )
}

function MonthPicker({ allSheets, currentMonth, currentYear }: {
    allSheets: SheetSummary[]
    currentMonth: number
    currentYear: number
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-x-2 text-2xl font-semibold text-white hover:text-white/80 transition-colors"
            >
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
                <ChevronDown className="size-5 mt-0.5" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-20 bg-white rounded-xl shadow-lg border overflow-hidden min-w-48">
                        {allSheets.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400">No sheets yet</p>
                        ) : (
                            <ul>
                                {allSheets.map(s => {
                                    const isActive = s.month === currentMonth && s.year === currentYear
                                    return (
                                        <li key={`${s.year}-${s.month}`}>
                                            <Link
                                                href={`/monthly-sheet?month=${s.month}&year=${s.year}`}
                                                onClick={() => setIsOpen(false)}
                                                className={`block w-full px-4 py-2.5 text-sm transition-colors
                                                    ${isActive
                                                        ? "bg-gray-100 font-medium text-gray-900"
                                                        : "text-gray-600 hover:bg-gray-50"
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