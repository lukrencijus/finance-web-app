"use client"

import { useState } from "react"
import { RefreshCw, StopCircle } from "lucide-react"
import { toggleRecurring } from "@/app/(dashboard)/monthly-sheet/actions"
import { useRouter } from "next/navigation"

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

type RecurringTransaction = {
    id: string
    amount: number
    description: string | null
    type: string
    category: { name: string; icon: string | null }
    monthlySheet: { month: number; year: number }
}

type Props = {
    income: RecurringTransaction[]
    expenses: RecurringTransaction[]
    currentMonth: number
    currentYear: number
}

export function RecurringTransactionsClient({ income, expenses, currentMonth, currentYear }: Props) {
    const totalCount = income.length + expenses.length

    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

    return (
        <div className="max-w-lg mx-auto py-8 space-y-2">
            <h1 className="text-3xl font-semibold mb-8">Recurring Transactions</h1>

            {totalCount === 0 ? (
                <div className="bg-card rounded-xl p-10 shadow-sm border border-border text-center">
                    <RefreshCw className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-lg font-medium text-foreground mb-1">No recurring transactions</p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Mark any transaction as recurring in the Monthly Sheet and it will
                        automatically appear here and repeat every month.
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                        <RefreshCw className="size-4 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            <span className="font-semibold">{totalCount} transaction{totalCount !== 1 ? "s" : ""}</span> will
                            automatically repeat when{" "}
                            <span className="font-semibold">{MONTH_NAMES[nextMonth - 1]} {nextYear}</span> opens.
                            Click the stop button to cancel recurrence.
                        </p>
                    </div>

                    {income.length > 0 && (
                        <Section title="Income" type="INCOME" transactions={income} />
                    )}

                    {expenses.length > 0 && (
                        <Section title="Expenses" type="EXPENSE" transactions={expenses} />
                    )}
                </>
            )}
        </div>
    )
}

function Section({ title, type, transactions }: {
    title: string
    type: "INCOME" | "EXPENSE"
    transactions: RecurringTransaction[]
}) {
    const badgeClass = type === "INCOME"
        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
        : "bg-destructive/10 text-destructive border-destructive/20"

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xl border ${badgeClass}`}>
                    {transactions.length}
                </span>
            </div>
            <ul className="divide-y divide-border">
                {transactions.map(t => (
                    <RecurringRow key={t.id} transaction={t} />
                ))}
            </ul>
        </div>
    )
}

function RecurringRow({ transaction: t }: { transaction: RecurringTransaction }) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const handleStop = async () => {
        if (isPending) return
        if (!confirm(
            `Stop recurring "${t.category.name}${t.description ? ` - ${t.description}` : ""}"?\n\nThis month's entry stays, but it won't repeat next month.`
        )) return
        setIsPending(true)
        await toggleRecurring(t.id)
        router.refresh()
        setIsPending(false)
    }

    return (
        <li className="flex items-center gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
            <div className="shrink-0 w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <RefreshCw className="size-3.5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                    {t.category.icon} {t.category.name}
                </p>
                {t.description && (
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                    Since {MONTH_NAMES[t.monthlySheet.month - 1]} {t.monthlySheet.year}
                </p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${
                t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-destructive"
            }`}>
                {t.type === "INCOME" ? "+" : "-"}€{t.amount.toFixed(2)}
            </span>
            <button
                onClick={handleStop}
                disabled={isPending}
                title="Stop recurring"
                className="shrink-0 text-muted-foreground/40 hover:text-destructive disabled:opacity-30 transition-colors"
            >
                <StopCircle className="size-5" />
            </button>
        </li>
    )
}