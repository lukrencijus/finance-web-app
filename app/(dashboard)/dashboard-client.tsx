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
    color: string
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
    return "€" + n.toLocaleString("en-IE", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })
}

function calcDelta(
    current: number,
    prev: number | null,
    mode: "percent" | "absolute" = "percent"
): { label: string; positive: boolean } | null {
    // If no previous data exists, show nothing
    if (prev === null) return null
    
    const diff = current - prev
    
    // Hide if there is absolutely no change
    if (diff === 0) return null
    if (current === 0) return null

    if (prev === 0 || Math.abs(prev) < 0.01) {
        return { label: `${diff >= 0 ? "+" : ""}${fmt(diff)} vs last month`, positive: diff >= 0 }
    }

    const pct = ((current - prev) / Math.abs(prev)) * 100

    if (Math.abs(pct) > 999) {
        return { label: `${diff >= 0 ? "+" : ""}${fmt(diff)} vs last month`, positive: diff >= 0 }
    }
    return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`, positive: pct >= 0 }
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
            ? "text-green-600 dark:text-green-400"
            : "text-destructive"

    const barColor = bar !== undefined && bar < 0 ? "bg-destructive" : "bg-blue-600 dark:bg-blue-500"

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                {label}
            </p>
            <p className="text-2xl font-bold text-foreground leading-tight">
                {value}
            </p>
            
            {/* Trend Label */}
            {d && (
                <p className={`text-xs mt-2 font-medium ${deltaColor}`}>
                    {d.label}
                </p>
            )}

            {/* Progress Bar (for Savings Rate) */}
            {bar !== undefined && (
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(Math.max(Math.abs(bar) * 100, 0), 100)}%` }}
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
    const netDelta = calcDelta(data.netSaved, prevNet)

    const maxExpenseCat = Math.max(...(data.categoryBreakdown?.map(c => c.amount) ?? []), 1)
    const maxIncomeCat  = Math.max(...(data.incomeCategoryBreakdown?.map(c => c.amount) ?? []), 1)

    const [settings, setSettings] = useState({
        showTrend: true,
        showExpenses: true,
        showIncome: true,
        showCapital: true,
        showRecent: true
    });

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleWidget = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            
            {/* Header Area with Settings Toggle */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                        {monthLabel} - overview
                    </p>
                    <h1 className="text-2xl font-semibold text-foreground">Financial Status</h1>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 text-xs border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors font-medium bg-card"
                    >
                        Customize Dashboard
                    </button>

                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 z-20 bg-card border border-border rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">Toggle Widgets</p>
                                <div className="space-y-1">
                                    {Object.entries(settings).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => toggleWidget(key as keyof typeof settings)}
                                            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded-md text-sm transition-colors"
                                        >
                                            <span className="capitalize">{key.replace('show', '')}</span>
                                            <div className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-4.5' : 'left-0.5'}`} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Always Shown: Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Total income"   value={fmt(data.currentIncome)}   d={incomeDelta}   positiveIsGood={true} />
                <MetricCard label="Total expenses" value={fmt(data.currentExpenses)}  d={expensesDelta} positiveIsGood={false} />
                <MetricCard label="Net saved"      value={fmt(data.netSaved)}         d={netDelta}      positiveIsGood={true} />
                <MetricCard
                    label={data.savingsRate >= 0 ? "Savings rate" : "Burn rate"}
                    value={`${(data.savingsRate * 100).toFixed(1)}%`}
                    bar={data.savingsRate}
                />
            </div>

            {/* Customizable Widgets */}
            {/* Charts row - items-stretch makes the chart card fill the height of the right column */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                
                {/* Trend Chart Widget */}
                {settings.showTrend && (
                    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                            Income vs expenses - last 6 months
                        </p>
                        <div className="relative flex-1 min-h-60">
                            <canvas ref={chartRef} />
                        </div>
                        <div className="flex gap-4 mt-3">
                            <Legend color="#3B6D11" label="Income" />
                            <Legend color="#A32D2D" label="Expenses" dashed />
                        </div>
                    </div>
                )}

                {/* Category Breakdowns Widget */}
                {(settings.showExpenses || settings.showIncome) && (
                    <div className="flex flex-col gap-4">
                        {settings.showExpenses && (
                            <div className="rounded-xl border border-border bg-card p-4 flex-1">
                                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                                    Expenses by category
                                </p>
                                {data.categoryBreakdown.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No expenses this month.</p>
                                ) : (
                                    <CategoryBars items={data.categoryBreakdown} max={maxExpenseCat} colors={CAT_COLORS} />
                                )}
                            </div>
                        )}

                        {settings.showIncome && (
                            <div className="rounded-xl border border-border bg-card p-4 flex-1">
                                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                                    Income by category
                                </p>
                                {!data.incomeCategoryBreakdown || data.incomeCategoryBreakdown.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No income entries this month.</p>
                                ) : (
                                    <CategoryBars items={data.incomeCategoryBreakdown} max={maxIncomeCat} colors={INCOME_COLORS} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Capital Breakdown Widget */}
                {settings.showCapital && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                            Capital breakdown
                        </p>
                        {data.capitals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No capital entries.</p>
                        ) : (
                            <>
                                {data.capitals.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                            <span className="text-sm text-foreground">{c.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">
                                                {data.totalCapital > 0 ? ((c.amount / data.totalCapital) * 100).toFixed(1) : "0"}%
                                            </span>
                                            <span className="text-sm font-medium text-foreground">{fmt(c.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-3 mt-1">
                                    <span className="text-xs text-muted-foreground">Total net worth</span>
                                    <span className="text-sm font-semibold text-foreground">{fmt(data.totalCapital)}</span>
                                </div>
                            </>
                        )}
                    </div>
                )}


                {/* Recent transactions */}
                {settings.showRecent && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                            Recent transactions
                        </p>
                        {data.recentTransactions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No recent transactions.</p>
                        ) : (
                            <div>
                                {data.recentTransactions.map((t) => {
                                    const isIncome = t.type === "INCOME"
                                    const txDate   = new Date(t.date)
                                    const hasUniqueDesc = t.description && t.description !== t.category.name
                                    return (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
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
                                                    <p className="text-sm text-foreground truncate">
                                                        {t.description || t.category.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
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
                )}
            </div>
        </div>
    )
}