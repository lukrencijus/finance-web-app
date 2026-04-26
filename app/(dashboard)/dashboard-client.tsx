"use client"

import { useEffect, useRef, useState } from "react"
import {
    Chart,
    LineElement,
    PointElement,
    LineController,
    CategoryScale,
    LinearScale,
    Tooltip,
    Filler,
} from "chart.js"

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler)

type MonthlyTotal = {
    month: number
    year: number
    income: number | null
    expenses: number | null
}

type CategoryBreakdown = {
    name: string
    icon: string | null
    amount: number
}

type RecentTransaction = {
    id: string
    description: string | null
    amount: number
    type: string
    date: string
    category: { name: string; icon: string | null }
}

type Capital = {
    id: string
    name: string
    amount: number
}

export type DashboardData = {
    currentMonth: number
    currentYear: number
    currentIncome: number
    currentExpenses: number
    netSaved: number
    savingsRate: number
    prevIncome: number | null
    prevExpenses: number | null
    monthlyTotals: MonthlyTotal[]
    categoryBreakdown: CategoryBreakdown[]
    incomeCategoryBreakdown?: CategoryBreakdown[]
    recentTransactions: RecentTransaction[]
    capitals: Capital[]
    totalCapital: number
}

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const MONTH_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const CAT_COLORS = [
    "#C94444",
    "#B83A3A",
    "#A83030",
    "#962828",
    "#842020",
    "#721A1A",
    "#601414",
]

const INCOME_COLORS = [
    "#4A9E22",
    "#3FA025",
    "#32881B",
    "#267012",
    "#1A590A",
    "#145006",
    "#0F3D04",
]

function fmt(n: number) {
    return "€" + n.toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function calcDelta(
    current: number,
    prev: number | null,
    mode: "percent" | "absolute" = "percent"
): { label: string; positive: boolean } | null {
    if (prev === null) return null
    const diff = current - prev

    if (mode === "absolute") {
        const direction = diff >= 0 ? "more" : "less"
        return {
            label: `${fmt(Math.abs(diff))} ${direction} than last month`,
            positive: diff >= 0,
        }
    }

    if (prev === 0 || Math.abs(prev) < 1) {
        return { label: `${diff >= 0 ? "+" : ""}${fmt(diff)} vs prev`, positive: diff >= 0 }
    }
    const pct = ((current - prev) / Math.abs(prev)) * 100
    if (Math.abs(pct) > 999) {
        return { label: `${diff >= 0 ? "+" : ""}${fmt(diff)} vs prev`, positive: diff >= 0 }
    }
    return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs prev`, positive: pct >= 0 }
}

function MetricCard({
    label,
    value,
    d,
    positiveIsGood,
    bar,
}: {
    label: string
    value: string
    d?: { label: string; positive: boolean } | null
    positiveIsGood?: boolean
    bar?: number
}) {
    const deltaColor = d == null
        ? ""
        : d.positive === positiveIsGood
            ? "text-green-700 dark:text-green-400"
            : "text-red-700 dark:text-red-400"

    const barColor = bar !== undefined && bar < 0 ? "bg-red-600" : "bg-green-600"

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-xl font-medium text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
            {d && <p className={`text-xs mt-1 ${deltaColor}`}>{d.label}</p>}
            {bar !== undefined && (
                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.min(Math.abs(bar) * 100, 100)}%` }}
                    />
                </div>
            )}
        </div>
    )
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
    return (
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
                style={{
                    display: "inline-block",
                    width: 18,
                    height: 2,
                    borderRadius: 2,
                    backgroundColor: dashed ? "transparent" : color,
                    borderTop: dashed ? `2px dashed ${color}` : "none",
                }}
            />
            {label}
        </span>
    )
}

function CategoryBars({
    items,
    max,
    colors,
}: {
    items: CategoryBreakdown[]
    max: number
    colors: string[]
}) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }, [])

    return (
        <div className="space-y-2">
            {items.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0 truncate">{cat.name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: mounted ? `max(6px, ${(cat.amount / max) * 100}%)` : "0px",
                                backgroundColor: colors[i % colors.length],
                                transition: `width 0.45s ease ${i * 50}ms`,
                            }}
                        />
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right shrink-0">{fmt(cat.amount)}</span>
                </div>
            ))}
        </div>
    )
}

export function DashboardClient({ data }: { data: DashboardData }) {
    const chartRef = useRef<HTMLCanvasElement>(null)
    const chartInstance = useRef<Chart | null>(null)

    const incomeDelta   = calcDelta(data.currentIncome, data.prevIncome)
    const expensesDelta = calcDelta(data.currentExpenses, data.prevExpenses)
    const prevNet       = data.prevIncome !== null && data.prevExpenses !== null
        ? data.prevIncome - data.prevExpenses : null
    const netDelta = calcDelta(data.netSaved, prevNet, "absolute")

    const maxExpenseCat = Math.max(...(data.categoryBreakdown?.map(c => c.amount) ?? []), 1)
    const maxIncomeCat  = Math.max(...(data.incomeCategoryBreakdown?.map(c => c.amount) ?? []), 1)

    useEffect(() => {
        if (!chartRef.current) return

        const labels      = data.monthlyTotals.map((m) => MONTH_SHORT[m.month - 1])
        const incomeData  = data.monthlyTotals.map((m) => m.income ?? 0)
        const expenseData = data.monthlyTotals.map((m) => m.expenses ?? 0)

        if (chartInstance.current) chartInstance.current.destroy()

        chartInstance.current = new Chart(chartRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Income",
                        data: incomeData,
                        borderColor: "#3B6D11",
                        backgroundColor: "rgba(59,109,17,0.07)",
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: "#3B6D11",
                        fill: false,
                        tension: 0.35,
                    },
                    {
                        label: "Expenses",
                        data: expenseData,
                        borderColor: "#A32D2D",
                        backgroundColor: "rgba(163,45,45,0.05)",
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 3,
                        pointBackgroundColor: "#A32D2D",
                        fill: false,
                        tension: 0.35,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, color: "#888" },
                    },
                    y: {
                        grid: { color: "rgba(120,120,120,0.1)" },
                        ticks: {
                            font: { size: 11 },
                            color: "#888",
                            callback: (v) =>
                                Number(v) >= 1000
                                    ? "€" + (Number(v) / 1000).toFixed(1) + "k"
                                    : "€" + v,
                        },
                    },
                },
            },
        })

        return () => { chartInstance.current?.destroy() }
    }, [data.monthlyTotals])

    const monthLabel = `${MONTH_FULL[data.currentMonth - 1]} ${data.currentYear}`

    return (
        <div className="p-6 max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
                    {monthLabel} - overview
                </p>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    Financial Status
                </h1>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <MetricCard label="Total income"   value={fmt(data.currentIncome)}   d={incomeDelta}   positiveIsGood={true} />
                <MetricCard label="Total expenses" value={fmt(data.currentExpenses)}  d={expensesDelta} positiveIsGood={false} />
                <MetricCard label="Net saved"      value={fmt(data.netSaved)}         d={netDelta}      positiveIsGood={true} />
                <MetricCard
                    label={data.savingsRate >= 0 ? "Savings rate" : "Burn rate"}
                    value={`${(data.savingsRate * 100).toFixed(1)}%`}
                    bar={data.savingsRate}
                />
            </div>

            {/* Charts row - items-stretch makes the chart card fill the height of the right column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-stretch">

                {/* Trend chart - flex-col so the canvas can grow to fill remaining height */}
                <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                        Income vs expenses - last 6 months
                    </p>
                    <div className="relative flex-1 min-h-44">
                        <canvas
                            ref={chartRef}
                            role="img"
                            aria-label="Line chart comparing monthly income and expenses"
                        />
                    </div>
                    <div className="flex gap-4 mt-3">
                        <Legend color="#3B6D11" label="Income" />
                        <Legend color="#A32D2D" label="Expenses" dashed />
                    </div>
                </div>

                {/* Right column - spending + income by category stacked */}
                <div className="flex flex-col gap-4">

                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                            Spending by category
                        </p>
                        {data.categoryBreakdown.length === 0 ? (
                            <p className="text-sm text-gray-400">No expenses this month.</p>
                        ) : (
                            <CategoryBars items={data.categoryBreakdown} max={maxExpenseCat} colors={CAT_COLORS} />
                        )}
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                            Income by category
                        </p>
                        {!data.incomeCategoryBreakdown || data.incomeCategoryBreakdown.length === 0 ? (
                            <p className="text-sm text-gray-400">No income entries this month.</p>
                        ) : (
                            <CategoryBars items={data.incomeCategoryBreakdown} max={maxIncomeCat} colors={INCOME_COLORS} />
                        )}
                    </div>

                </div>

            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Capital breakdown */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                        Capital breakdown
                    </p>
                    {data.capitals.length === 0 ? (
                        <p className="text-sm text-gray-400">No capital entries.</p>
                    ) : (
                        <>
                            {data.capitals.map((c, i) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400">
                                            {data.totalCapital > 0
                                                ? ((c.amount / data.totalCapital) * 100).toFixed(1)
                                                : "0"}%
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {fmt(c.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-between pt-3 mt-1">
                                <span className="text-xs text-gray-400">Total net worth</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {fmt(data.totalCapital)}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Recent transactions */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
                        Recent transactions
                    </p>
                    {data.recentTransactions.length === 0 ? (
                        <p className="text-sm text-gray-400">No recent transactions.</p>
                    ) : (
                        <div>
                            {data.recentTransactions.map((t) => {
                                const isIncome = t.type === "INCOME"
                                const txDate   = new Date(t.date)
                                const hasUniqueDesc = t.description && t.description !== t.category.name
                                return (
                                    <div
                                        key={t.id}
                                        className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                                                style={{
                                                    backgroundColor: isIncome ? "#EAF3DE" : "#FCEBEB",
                                                    color: isIncome ? "#3B6D11" : "#A32D2D",
                                                }}
                                            >
                                                {t.category.icon ?? (isIncome ? "↑" : "↓")}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                                                    {t.description || t.category.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {hasUniqueDesc ? `${t.category.name} · ` : ""}
                                                    {txDate.toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className="text-sm font-medium shrink-0 ml-2"
                                            style={{ color: isIncome ? "#3B6D11" : "#A32D2D" }}
                                        >
                                            {isIncome ? "+" : "-"}{fmt(t.amount)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}