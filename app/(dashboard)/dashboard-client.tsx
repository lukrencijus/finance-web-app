"use client"

import { useEffect, useRef, useState } from "react"
import {
    Chart,
    LineElement,
    PointElement,
    LineController,
    BarElement,
    BarController,
    CategoryScale,
    LinearScale,
    Tooltip,
    Filler,
} from "chart.js"
import { MonthPicker } from "@/components/month-picker"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

Chart.register(LineElement, PointElement, LineController, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Filler)

type MonthlyTotal = {
    month: number
    year: number
    income: number | null
    expenses: number | null
    capitalTotal: number | null
}

type CategoryBreakdown = {
    name: string
    icon: string | null
    amount: number
    /** Same category's total last month. null = no previous sheet to compare against. */
    prevAmount?: number | null
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
    capitalCategoryId: string
    name: string
    color: string
    amount: number
}

type DailyActivity = {
    day: number
    income: number
    expenses: number
    count: number
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
    prevCapitals: Record<string, number>
    totalCapital: number
    prevTotalCapital: number | null
    capitalsAsOfMonth: number | null
    capitalsAsOfYear: number | null
    expectedCapital: number | null
    capitalDiscrepancy: number | null
    cashBreakdown: { expected: number | null; actual: number | null; discrepancy: number | null }
    bankBreakdown: { expected: number | null; actual: number | null; discrepancy: number | null }
    dailyActivity: DailyActivity[]
}

type SheetSummary = { month: number; year: number }

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

const fmt = formatCurrency

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
    return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1).replace(".", ",")}% vs last month`, positive: pct >= 0 }
}

// Animates from 0 up to `value` on mount, and from the old value to the new
// one whenever `value` changes (e.g. switching months).
function useCountUp(value: number, duration = 700) {
    const [display, setDisplay] = useState(0)
    const fromRef = useRef(0)

    useEffect(() => {
        const from = fromRef.current
        const to = value
        if (from === to) return

        const start = performance.now()
        let raf: number

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
            const current = from + (to - from) * eased
            setDisplay(current)
            if (t < 1) {
                raf = requestAnimationFrame(tick)
            } else {
                fromRef.current = to
            }
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [value, duration])

    return display
}

function AnimatedValue({ value, format }: { value: number; format: (n: number) => string }) {
    const display = useCountUp(value)
    return <>{format(display)}</>
}

function MetricCard({
    label,
    value,
    format,
    d,
    positiveIsGood,
    bar,
}: {
    label: string
    value: number
    format: (n: number) => string
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
        <div className="relative bg-card border border-border rounded-xl p-5 shadow-sm">
            {d && (
                d.positive
                    ? <ArrowUpRight className={`absolute top-4 right-4 size-4 ${deltaColor}`} />
                    : <ArrowDownRight className={`absolute top-4 right-4 size-4 ${deltaColor}`} />
            )}
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                {label}
            </p>
            <p className="text-2xl font-bold text-foreground leading-tight tabular-nums">
                <AnimatedValue value={value} format={format} />
            </p>

            {/* Trend Label */}
            {d && (
                <p className={`text-xs mt-2 font-medium ${deltaColor}`}>
                    {d.label}
                </p>
            )}

            {/* Progress Bar (for Savings Rate) */}
            {bar !== undefined && (
                <div className="mt-3 h-1.5 bg-muted rounded-xl overflow-hidden">
                    <div
                        className={`h-full rounded-xl transition-all duration-500 ${barColor}`}
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

/**
 * Month-over-month change for a single category bar, as an absolute amount.
 *
 * Colour follows meaning rather than sign: spending more is bad (red), earning
 * more is good (green). Returns null when there is nothing worth showing.
 */
function categoryDelta(cat: CategoryBreakdown, isIncome: boolean) {
    const prev = cat.prevAmount
    if (prev === null || prev === undefined) return null

    // Absent last month entirely - a percentage would be meaningless here.
    if (prev === 0) {
        return { label: "new", className: "text-gray-400", title: "No activity in this category last month" }
    }

    const diff = cat.amount - prev
    if (Math.abs(diff) < 0.01) return null

    const good = isIncome ? diff > 0 : diff < 0
    return {
        label: `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff))}`,
        className: good ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
        title: `${fmt(prev)} last month`,
    }
}

function CategoryBars({
    items,
    max,
    colors,
    isIncome,
}: {
    items: CategoryBreakdown[]
    max: number
    colors: string[]
    isIncome: boolean
}) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }, [])

    return (
        <div className="space-y-2">
            {items.map((cat, i) => {
                const delta = categoryDelta(cat, isIncome)
                return (
                    <div key={cat.name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0 truncate">
                            <span className="mr-1">{cat.icon || (isIncome ? "↑" : "↓")}</span>{cat.name}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                            <div
                                className="h-full rounded-xl"
                                style={{
                                    width: mounted ? `max(6px, ${(cat.amount / max) * 100}%)` : "0px",
                                    backgroundColor: colors[i % colors.length],
                                    transition: `width 0.45s ease ${i * 50}ms`,
                                }}
                            />
                        </div>
                        <span className="w-20 shrink-0 text-right leading-tight">
                            <span className="block text-xs text-gray-500">{fmt(cat.amount)}</span>
                            {delta && (
                                <span className={`block text-[10px] ${delta.className}`} title={delta.title}>
                                    {delta.label}
                                </span>
                            )}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

const defaultSettings = {
    showCapital: true,
    showTrend: true,
    showNetWorth: true,
    showHeatmap: true,
    showExpenses: true,
    showIncome: true,
    showRecent: true,
}

const WIDGET_LABELS: Record<keyof typeof defaultSettings, string> = {
    showCapital: "Capital Breakdown",
    showTrend: "Income vs Expenses",
    showNetWorth: "Net Worth Trend",
    showExpenses: "Expenses by Category",
    showIncome: "Income by Category",
    showRecent: "Recent Transactions",
    showHeatmap: "Transactions",
}

export function DashboardClient({
    data,
    allSheets,
    isActualCurrentMonth,
    basePath = "/",
}: {
    data: DashboardData
    allSheets: SheetSummary[]
    isActualCurrentMonth: boolean
    basePath?: string
}) {
    const chartRef = useRef<HTMLCanvasElement>(null)
    const chartInstance = useRef<Chart | null>(null)
    const netWorthChartRef = useRef<HTMLCanvasElement>(null)
    const netWorthChartInstance = useRef<Chart | null>(null)
    const transactionsChartRef = useRef<HTMLCanvasElement>(null)
    const transactionsChartInstance = useRef<Chart | null>(null)
    const isFirstRender = useRef(true)

    const incomeDelta   = calcDelta(data.currentIncome, data.prevIncome)
    const expensesDelta = calcDelta(data.currentExpenses, data.prevExpenses)
    const prevNet       = data.prevIncome !== null && data.prevExpenses !== null
        ? data.prevIncome - data.prevExpenses : null
    const netDelta = calcDelta(data.netSaved, prevNet)
    const capitalDelta = calcDelta(data.totalCapital, data.prevTotalCapital)
    // Gates the "expected vs actual" toggle. Whether there's a breakdown to
    // show at all, not whether anything is off - a month where everything
    // matches still gets the toggle, with checkmarks instead of deltas.
    const hasExpectedData =
        data.expectedCapital !== null ||
        data.cashBreakdown.expected !== null ||
        data.bankBreakdown.expected !== null

    const maxExpenseCat = Math.max(...(data.categoryBreakdown?.map(c => c.amount) ?? []), 1)
    const maxIncomeCat  = Math.max(...(data.incomeCategoryBreakdown?.map(c => c.amount) ?? []), 1)

    const [settings, setSettings] = useState<typeof defaultSettings>(defaultSettings)
    const [mounted, setMounted] = useState(false)
    const [showDiscrepancy, setShowDiscrepancy] = useState(false)

    useEffect(() => {
        // Read persisted widget settings on mount. Deliberately effect-based (not a lazy
        // useState initializer) so the server-rendered and first client render match,
        // avoiding a hydration mismatch - localStorage isn't available on the server.
        try {
            const saved = localStorage.getItem("dashboard-settings")
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) })
        } catch {}
        setMounted(true)
    }, [])

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
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${fmt(Number(ctx.raw))}`,
                        },
                    },
                },
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
                                    ? "€" + (Number(v) / 1000).toFixed(1).replace(".", ",") + "k"
                                    : "€" + v,
                        },
                    },
                },
            },
        })

        return () => { chartInstance.current?.destroy() }
    }, [data.monthlyTotals, mounted, settings.showTrend])

    useEffect(() => {
        if (!netWorthChartRef.current) return

        const labels = data.monthlyTotals.map((m) => MONTH_SHORT[m.month - 1])
        const netWorthData = data.monthlyTotals.map((m) => m.capitalTotal ?? 0)

        if (netWorthChartInstance.current) netWorthChartInstance.current.destroy()

        netWorthChartInstance.current = new Chart(netWorthChartRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Net worth",
                        data: netWorthData,
                        borderColor: "#6366F1",
                        backgroundColor: "rgba(99,102,241,0.07)",
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: "#6366F1",
                        fill: true,
                        tension: 0.35,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${fmt(Number(ctx.raw))}`,
                        },
                    },
                },
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
                                    ? "€" + (Number(v) / 1000).toFixed(1).replace(".", ",") + "k"
                                    : "€" + v,
                        },
                    },
                },
            },
        })

        return () => { netWorthChartInstance.current?.destroy() }
    }, [data.monthlyTotals, mounted, settings.showNetWorth])

    useEffect(() => {
        if (!transactionsChartRef.current) return

        // Just the day number - the month is already fixed by the dashboard's
        // month picker, and "1 Aug ... 31 Aug" does not fit 31 times over.
        // The tooltip still spells the full date out.
        const labels = data.dailyActivity.map((d) => String(d.day))
        const incomeData = data.dailyActivity.map((d) => d.income || null)
        const expenseData = data.dailyActivity.map((d) => d.expenses || null)

        if (transactionsChartInstance.current) transactionsChartInstance.current.destroy()

        transactionsChartInstance.current = new Chart(transactionsChartRef.current, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Income",
                        data: incomeData,
                        backgroundColor: "#3B82F6",
                        borderRadius: 2,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8,
                    },
                    {
                        label: "Expenses",
                        data: expenseData,
                        backgroundColor: "#E11D48",
                        borderRadius: 2,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) =>
                                `${items[0]?.label} ${MONTH_SHORT[data.currentMonth - 1]}`,
                            label: (ctx) => `${ctx.dataset.label}: ${fmt(Number(ctx.raw))}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 11 },
                            color: "#888",
                            autoSkip: true,
                            // The chart scrolls horizontally on mobile, so there is
                            // room for every day; Chart.js still drops labels by
                            // itself when the container really is too narrow.
                            maxTicksLimit: 31,
                            maxRotation: 0,
                        },
                    },
                    y: {
                        grid: { color: "rgba(120,120,120,0.1)" },
                        ticks: {
                            font: { size: 11 },
                            color: "#888",
                            callback: (v) =>
                                Number(v) >= 1000
                                    ? "€" + (Number(v) / 1000).toFixed(1).replace(".", ",") + "k"
                                    : "€" + v,
                        },
                    },
                },
            },
        })

        return () => { transactionsChartInstance.current?.destroy() }
    }, [data.dailyActivity, data.currentMonth, mounted, settings.showHeatmap])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        localStorage.setItem("dashboard-settings", JSON.stringify(settings))
    }, [settings])

    const monthLabel = `${MONTH_FULL[data.currentMonth - 1]} ${data.currentYear}`

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">

            {/* Month picker */}
            <div className="w-full">
                <MonthPicker
                    allSheets={allSheets}
                    currentMonth={data.currentMonth}
                    currentYear={data.currentYear}
                    basePath={basePath}
                    isActualCurrentMonth={isActualCurrentMonth}
                />
            </div>

            {/*
             * Header. Side by side on desktop, stacked on mobile - "Customize
             * Dashboard" is a wide button next to a two-line title, and
             * justify-between + items-center left it floating against neither
             * line on a narrow screen.
             */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-2">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                        {monthLabel} - overview
                    </p>
                    <h1 className="text-2xl font-semibold text-foreground">Financial Status</h1>
                </div>

                <div className="relative shrink-0">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-full lg:w-auto flex items-center justify-center gap-2 text-xs border border-border rounded-xl px-3 py-2.5 lg:py-2 hover:bg-muted transition-colors font-medium bg-card"
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
                                            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded-xl text-sm transition-colors"
                                        >
                                            <span>{WIDGET_LABELS[key as keyof typeof defaultSettings]}</span>
                                            <div className={`w-8 h-4 rounded-xl transition-colors relative ${value ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-xl transition-all ${value ? 'left-4.5' : 'left-0.5'}`} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/*
             * One card per row on a phone. Two-up meant ~160px of width each,
             * which cramped both the label and the amount; full width lets the
             * numbers breathe. Back to 2 and then 4 across as space allows.
             */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard label="Total income"   value={data.currentIncome}   format={fmt} d={incomeDelta}   positiveIsGood={true} />
                <MetricCard label="Total expenses" value={data.currentExpenses} format={fmt} d={expensesDelta} positiveIsGood={false} />
                <MetricCard label="Net saved"      value={data.netSaved}        format={fmt} d={netDelta}      positiveIsGood={true} />
                <MetricCard
                    label={data.savingsRate >= 0 ? "Savings rate" : "Burn rate"}
                    value={data.savingsRate * 100}
                    format={(n) => `${n.toFixed(1).replace(".", ",")}%`}
                    bar={data.savingsRate}
                />
            </div>

            {/* Customizable Widgets */}
            {mounted && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Capital Breakdown */}
                    {settings.showCapital && (
                        <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                    Capital breakdown
                                </p>
                                {data.capitalsAsOfMonth && data.capitalsAsOfYear && (
                                    <span className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-xl border border-amber-500/20">
                                        As of {MONTH_SHORT[data.capitalsAsOfMonth - 1]} {data.capitalsAsOfYear}
                                    </span>
                                )}
                            </div>
                            {data.capitals.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No capital entries.</p>
                            ) : (
                                <>
                                    {data.totalCapital > 0 && (
                                        <div className="flex h-3 rounded-xl overflow-hidden gap-0.5 bg-muted mb-4">
                                            {data.capitals.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="h-full"
                                                    style={{
                                                        width: `${(c.amount / data.totalCapital) * 100}%`,
                                                        backgroundColor: c.color,
                                                        minWidth: "4px",
                                                    }}
                                                    title={`${c.name}: ${((c.amount / data.totalCapital) * 100).toFixed(1).replace(".", ",")}% (${fmt(c.amount)})`}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* List */}
                                    <div className="flex-1 flex flex-col min-h-52">
                                        <div className="overflow-y-auto flex-1 max-h-44">
                                            {data.capitals.map((c) => {
                                                const prevAmount = data.prevCapitals[c.capitalCategoryId]
                                                const growth = prevAmount !== undefined ? c.amount - prevAmount : null
                                                return (
                                                <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="w-2 h-2 rounded-xl shrink-0" style={{ backgroundColor: c.color }} />
                                                        <div className="min-w-0">
                                                            <span className="text-sm text-foreground truncate block">{c.name}</span>
                                                            {growth !== null && growth !== 0 && (
                                                                <span className={`text-[11px] font-medium ${growth > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                                                    {growth > 0 ? "+" : "-"}{fmt(Math.abs(growth))} vs last month
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className="text-xs text-muted-foreground">
                                                            {data.totalCapital > 0 ? ((c.amount / data.totalCapital) * 100).toFixed(1).replace(".", ",") : "0"}%
                                                        </span>
                                                        <span className="text-sm font-medium text-foreground">{fmt(c.amount)}</span>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                        <div className="flex justify-between items-end gap-2 pt-3 mt-auto border-t border-border">
                                            <div className="min-w-0">
                                                <span className="text-xs text-muted-foreground">Total net worth</span>
                                                {capitalDelta && (
                                                    <p className={`text-xs font-medium mt-0.5 ${capitalDelta.positive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                                        {capitalDelta.label}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-foreground shrink-0 tabular-nums">{fmt(data.totalCapital)}</span>
                                        </div>
                                        {hasExpectedData && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDiscrepancy(v => !v)}
                                                    className="text-xs font-medium text-muted-foreground hover:text-foreground mt-2 transition-colors"
                                                >
                                                    {showDiscrepancy ? "Hide" : "Show"} expected vs actual {showDiscrepancy ? "▲" : "▼"}
                                                </button>
                                                {showDiscrepancy && (
                                                    // expected → entered, then the gap as a signed number.
                                                    // discrepancy = actual - expected (see lib/sheets.ts), so
                                                    // positive means you have more than expected (green) and
                                                    // negative means you're short (red). A match
                                                    // still gets its own row with a checkmark rather than being
                                                    // dropped - the point is to see all three at a glance, not
                                                    // just the ones that are off.
                                                    <div className="mt-2 space-y-1 text-xs tabular-nums">
                                                        {data.expectedCapital !== null && (
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-muted-foreground">💰 Total {fmt(data.expectedCapital)} → {fmt(data.totalCapital)}</span>
                                                                {data.capitalDiscrepancy !== null && Math.abs(data.capitalDiscrepancy) >= 0.01 ? (
                                                                    <span className={`font-semibold ${data.capitalDiscrepancy > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                                                        {data.capitalDiscrepancy > 0 ? "+" : "−"}{fmt(Math.abs(data.capitalDiscrepancy))}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {data.cashBreakdown.expected !== null && data.cashBreakdown.actual !== null && (
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-muted-foreground">💵 Cash {fmt(data.cashBreakdown.expected)} → {fmt(data.cashBreakdown.actual)}</span>
                                                                {data.cashBreakdown.discrepancy !== null && Math.abs(data.cashBreakdown.discrepancy) >= 0.01 ? (
                                                                    <span className={`font-semibold ${data.cashBreakdown.discrepancy > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                                                        {data.cashBreakdown.discrepancy > 0 ? "+" : "−"}{fmt(Math.abs(data.cashBreakdown.discrepancy))}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {data.bankBreakdown.expected !== null && data.bankBreakdown.actual !== null && (
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-muted-foreground">💳 Bank {fmt(data.bankBreakdown.expected)} → {fmt(data.bankBreakdown.actual)}</span>
                                                                {data.bankBreakdown.discrepancy !== null && Math.abs(data.bankBreakdown.discrepancy) >= 0.01 ? (
                                                                    <span className={`font-semibold ${data.bankBreakdown.discrepancy > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                                                        {data.bankBreakdown.discrepancy > 0 ? "+" : "−"}{fmt(Math.abs(data.bankBreakdown.discrepancy))}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
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

                    {/* Net Worth Chart Widget */}
                    {settings.showNetWorth && (
                        <div className="flex flex-col rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                                Net worth - last 6 months
                            </p>
                            <div className="relative flex-1 min-h-52">
                                <canvas ref={netWorthChartRef} />
                            </div>
                            <div className="flex gap-4 mt-3">
                                <Legend color="#6366F1" label="Net worth" />
                            </div>
                        </div>
                    )}

                    {/* Transactions Widget */}
                    {settings.showHeatmap && (
                        <div className="flex flex-col rounded-xl border border-border bg-card p-4 md:col-span-2">
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                                Transactions
                            </p>
                            {/*
                             * A month is up to 31 days x 2 bars. Squeezed into a
                             * phone-width card that is ~3px per bar with most day
                             * labels dropped. Give each day a fixed width and let
                             * the chart scroll sideways instead; on desktop there
                             * is room, so it goes back to filling the card.
                             */}
                            <div className="flex-1 min-h-60 overflow-x-auto overflow-y-hidden overscroll-x-contain">
                                <div className="relative h-full min-h-60 min-w-[680px] lg:min-w-0">
                                    <canvas ref={transactionsChartRef} />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-3">
                                <Legend color="#3B82F6" label="Income" />
                                <Legend color="#E11D48" label="Expenses" />
                            </div>
                        </div>
                    )}

                    {/* Category Breakdowns Widgets */}
                    {settings.showExpenses && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                                Expenses by category
                            </p>
                            {data.categoryBreakdown.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No expenses this month.</p>
                            ) : (
                                <CategoryBars items={data.categoryBreakdown} max={maxExpenseCat} colors={CAT_COLORS} isIncome={false} />
                            )}
                        </div>
                    )}

                    {settings.showIncome && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                                Income by category
                            </p>
                            {!data.incomeCategoryBreakdown || data.incomeCategoryBreakdown.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No income entries this month.</p>
                            ) : (
                                <CategoryBars items={data.incomeCategoryBreakdown} max={maxIncomeCat} colors={INCOME_COLORS} isIncome={true} />
                            )}
                        </div>
                    )}

                    {/* Recent transactions */}
                    {settings.showRecent && (
                        <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
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
                                                        className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0"
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
                                                            {formatDateShort(txDate)}
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
            )}
        </div>
    )
}