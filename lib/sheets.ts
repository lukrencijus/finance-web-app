import { prisma } from "@/lib/prisma"

/** How far back we look for a recurring series' last occurrence. Matches the
 *  split feature's 1-24 month range, so even a yearly-interval series is
 *  always found within the window. */
const RECURRING_LOOKBACK_MONTHS = 24

type RecurringSourceTx = {
    id: string
    amount: number
    description: string | null
    type: string
    categoryId: string
    date: Date
    recurringIntervalMonths: number | null
    paymentMethod: string
    month: number
    year: number
}

/**
 * Given every recurring transaction found in the lookback window, decides
 * which series are actually due in the target month.
 *
 * A "series" is identified by category+amount+description+type (same
 * signature used by the shared recurring-transactions page). Only the most
 * recent occurrence of each series matters - interval is measured from there,
 * not from the original start. If a series' cadence was skipped over a gap
 * (e.g. a quarterly bill during a month with no sheet at all), it simply
 * waits for the next month that lines up with its interval rather than
 * "catching up" - same trade-off the previous monthly-only logic made.
 */
export function selectDueRecurringTransactions(
    pastTransactions: RecurringSourceTx[],
    targetMonth: number,
    targetYear: number
): RecurringSourceTx[] {
    const latestBySignature = new Map<string, RecurringSourceTx>()
    for (const t of pastTransactions) {
        const key = `${t.categoryId}|${t.amount}|${t.description ?? ""}|${t.type}`
        const existing = latestBySignature.get(key)
        const rank = t.year * 12 + t.month
        if (!existing || rank > existing.year * 12 + existing.month) {
            latestBySignature.set(key, t)
        }
    }

    const targetRank = targetYear * 12 + targetMonth
    const due: RecurringSourceTx[] = []
    for (const t of latestBySignature.values()) {
        const interval = t.recurringIntervalMonths ?? 1
        const occRank = t.year * 12 + t.month
        const monthsElapsed = targetRank - occRank
        if (monthsElapsed > 0 && monthsElapsed % interval === 0) {
            due.push(t)
        }
    }
    return due
}

export async function getCurrentMonthSheet(userId: string, month: number, year: number) {
    // receives month/year from caller
    let sheet = await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month, year, userId } },
        include: {
            transactions: {
                include: { category: true },
                orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            },
            capitals: {
                include: { capitalCategory: true },
                orderBy: [
                    { capitalCategory: { order: "asc" } },
                    { capitalCategory: { createdAt: "desc" } },
                ],
            },
        },
    })

    if (!sheet) {
        // Create the new sheet first
        sheet = await prisma.monthlySheet.create({
            data: { month, year, userId },
            include: {
                transactions: {
                    include: { category: true },
                    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                },
                capitals: {
                    include: { capitalCategory: true },
                    orderBy: [
                        { capitalCategory: { order: "asc" } },
                        { capitalCategory: { createdAt: "desc" } },
                    ],
                },
            },
        })

        // Auto-insert recurring transactions that are due this month. Looks back
        // up to RECURRING_LOOKBACK_MONTHS so each series survives skipped months,
        // and evaluates each series against its own interval independently -
        // see selectDueRecurringTransactions.
        const lookbackMonths: { month: number; year: number }[] = []
        let searchMonth = month
        let searchYear = year
        for (let i = 0; i < RECURRING_LOOKBACK_MONTHS; i++) {
            searchMonth = searchMonth === 1 ? 12 : searchMonth - 1
            searchYear = searchMonth === 12 ? searchYear - 1 : searchYear
            lookbackMonths.push({ month: searchMonth, year: searchYear })
        }

        const pastRecurring = await prisma.transaction.findMany({
            where: {
                isRecurring: true,
                monthlySheet: {
                    userId,
                    OR: lookbackMonths.map(({ month, year }) => ({ month, year })),
                },
            },
            include: { monthlySheet: { select: { month: true, year: true } } },
        })

        const dueTransactions = selectDueRecurringTransactions(
            pastRecurring.map((t) => ({
                id: t.id,
                amount: t.amount,
                description: t.description,
                type: t.type,
                categoryId: t.categoryId,
                date: t.date,
                recurringIntervalMonths: t.recurringIntervalMonths,
                paymentMethod: t.paymentMethod,
                month: t.monthlySheet.month,
                year: t.monthlySheet.year,
            })),
            month,
            year
        )

        if (dueTransactions.length > 0) {
            // Clamp day to last day of new month (e.g. Feb 28/29)
            const lastDayOfMonth = new Date(year, month, 0).getDate()

            await prisma.transaction.createMany({
                data: dueTransactions.map((t) => {
                    const originalDay = new Date(t.date).getDate()
                    const day = Math.min(originalDay, lastDayOfMonth)
                    return {
                        amount: t.amount,
                        description: t.description,
                        date: new Date(year, month - 1, day),
                        type: t.type,
                        categoryId: t.categoryId,
                        monthlySheetId: sheet!.id,
                        isRecurring: true,
                        recurringIntervalMonths: t.recurringIntervalMonths,
                        paymentMethod: t.paymentMethod,
                        // Do not copy splitGroupId/splitIndex - recurring copies are fresh
                    }
                }),
            })

            // Re-fetch sheet with the newly inserted recurring transactions
            sheet = await prisma.monthlySheet.findUnique({
                where: { month_year_userId: { month, year, userId } },
                include: {
                    transactions: {
                        include: { category: true },
                        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                    },
                    capitals: {
                        include: { capitalCategory: true },
                        orderBy: [
                            { capitalCategory: { order: "asc" } },
                            { capitalCategory: { createdAt: "desc" } },
                        ],
                    },
                },
            })
        }
    }

    return sheet!
}

export async function getMonthSheet(userId: string, month: number, year: number) {
    return await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month, year, userId } },
        include: {
            transactions: {
                include: { category: true },
                orderBy: [
                    { date: "desc" },
                    { createdAt: "desc" },
                ],
            },
            capitals: {
                include: { capitalCategory: true },
                orderBy: [
                    { capitalCategory: { order: "asc" } },
                    { capitalCategory: { createdAt: "desc" } },
                ],
            },
        },
    })
}

export async function getDashboardData(userId: string, selectedMonth?: number, selectedYear?: number) {
    const now = new Date()
    const actualCurrentMonth = now.getMonth() + 1
    const actualCurrentYear = now.getFullYear()

    const currentMonth = selectedMonth ?? actualCurrentMonth
    const currentYear = selectedYear ?? actualCurrentYear

    // Build last 6 months (including the selected one) in descending order
    const monthsToFetch: { month: number; year: number }[] = []
    for (let i = 0; i < 6; i++) {
        let m = currentMonth - i
        let y = currentYear
        if (m <= 0) { m += 12; y -= 1 }
        monthsToFetch.push({ month: m, year: y })
    }

    const sheets = await prisma.monthlySheet.findMany({
        where: {
            userId,
            OR: monthsToFetch.map(({ month, year }) => ({ month, year })),
        },
        include: {
            transactions: { include: { category: true } },
            capitals: {
                include: { capitalCategory: true },
                orderBy: [
                    { capitalCategory: { order: "asc" } },
                    { capitalCategory: { createdAt: "desc" } },
                ],
            },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    })

    // Current sheet (most recent)
    const currentSheet = sheets.find(
        (s) => s.month === currentMonth && s.year === currentYear
    ) ?? null

    // Per-month totals for chart (oldest → newest)
    const monthlyTotals = monthsToFetch
        .slice()
        .reverse()
        .map(({ month, year }) => {
            const sheet = sheets.find((s) => s.month === month && s.year === year)
            const income = sheet
                ? sheet.transactions
                      .filter((t) => t.type === "INCOME")
                      .reduce((sum, t) => sum + t.amount, 0)
                : null
            const expenses = sheet
                ? sheet.transactions
                      .filter((t) => t.type === "EXPENSE")
                      .reduce((sum, t) => sum + t.amount, 0)
                : null
            const capitalTotal = sheet
                ? sheet.capitals.reduce((sum, c) => sum + c.amount, 0)
                : null
            return { month, year, income, expenses, capitalTotal }
        })

    // Current month aggregates
    const currentIncome = currentSheet
        ? currentSheet.transactions
              .filter((t) => t.type === "INCOME")
              .reduce((sum, t) => sum + t.amount, 0)
        : 0
    const currentExpenses = currentSheet
        ? currentSheet.transactions
              .filter((t) => t.type === "EXPENSE")
              .reduce((sum, t) => sum + t.amount, 0)
        : 0

    // Previous month for delta comparison
    let prevMonth = currentMonth - 1
    let prevYear = currentYear
    if (prevMonth <= 0) { prevMonth = 12; prevYear -= 1 }
    const prevSheet = sheets.find((s) => s.month === prevMonth && s.year === prevYear) ?? null
    const prevTotalCapital = prevSheet
        ? prevSheet.capitals.reduce((sum, c) => sum + c.amount, 0)
        : null
    const prevIncome = prevSheet
        ? prevSheet.transactions
              .filter((t) => t.type === "INCOME")
              .reduce((sum, t) => sum + t.amount, 0)
        : null
    const prevExpenses = prevSheet
        ? prevSheet.transactions
              .filter((t) => t.type === "EXPENSE")
              .reduce((sum, t) => sum + t.amount, 0)
        : null

    // Spending by category (current month expenses)
    const categoryMap = new Map<string, { name: string; icon: string | null; amount: number }>()
    if (currentSheet) {
        for (const t of currentSheet.transactions) {
            if (t.type !== "EXPENSE") continue
            const existing = categoryMap.get(t.categoryId)
            if (existing) {
                existing.amount += t.amount
            } else {
                categoryMap.set(t.categoryId, {
                    name: t.category.name,
                    icon: t.category.icon ?? null,
                    amount: t.amount,
                })
            }
        }
    }
    const categoryBreakdown = Array.from(categoryMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 7)

    // Income by category (current month)
    const incomeCategoryMap = new Map<string, { name: string; icon: string | null; amount: number }>()
    if (currentSheet) {
        for (const t of currentSheet.transactions) {
            if (t.type !== "INCOME") continue
            const existing = incomeCategoryMap.get(t.categoryId)
            if (existing) {
                existing.amount += t.amount
            } else {
                incomeCategoryMap.set(t.categoryId, {
                    name: t.category.name,
                    icon: t.category.icon ?? null,
                    amount: t.amount,
                })
            }
        }
    }
    const incomeCategoryBreakdown = Array.from(incomeCategoryMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 7)

    // Recent transactions (all sheets, last 5)
    const recentTransactions = await prisma.transaction.findMany({
        where: {
            monthlySheet: { userId },
        },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 7,
    })

    // Capital breakdown (selected month's sheet, falling back to the most recent
    // earlier month that has capital entries if the selected month has none yet)
    let capitals = currentSheet
        ? currentSheet.capitals.map((c) => ({
            id: c.id,
            name: c.capitalCategory.name,
            color: c.capitalCategory.color,
            amount: c.amount,
        }))
        : []
    let capitalsAsOfMonth: number | null = null
    let capitalsAsOfYear: number | null = null

    if (capitals.length === 0) {
        const fallbackSheet = await prisma.monthlySheet.findFirst({
            where: {
                userId,
                capitals: { some: {} },
                OR: [
                    { year: { lt: currentYear } },
                    { year: currentYear, month: { lt: currentMonth } },
                ],
            },
            include: {
                capitals: {
                    include: { capitalCategory: true },
                    orderBy: [
                        { capitalCategory: { order: "asc" } },
                        { capitalCategory: { createdAt: "desc" } },
                    ],
                },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        })

        if (fallbackSheet && fallbackSheet.capitals.length > 0) {
            capitals = fallbackSheet.capitals.map((c) => ({
                id: c.id,
                name: c.capitalCategory.name,
                color: c.capitalCategory.color,
                amount: c.amount,
            }))
            capitalsAsOfMonth = fallbackSheet.month
            capitalsAsOfYear = fallbackSheet.year
        }
    }
    const totalCapital = capitals.reduce((sum, c) => sum + c.amount, 0)

    // Expected vs actual capital: if last month's capital is known and this month's
    // capital was actually entered (not a fallback from an earlier month), flag any
    // gap between what the numbers say you should have and what you actually logged.
    const expectedCapital = capitalsAsOfMonth === null && prevTotalCapital !== null
        ? prevTotalCapital + currentIncome - currentExpenses
        : null
    const capitalDiscrepancy = expectedCapital !== null ? totalCapital - expectedCapital : null

    // Cash/bank breakdown: same idea as the aggregate expected/actual above,
    // but bucketed by CapitalCategory.moneyType and Transaction.paymentMethod.
    // Only computed once the user has tagged at least one capital category as
    // Cash or Bank - otherwise there's nothing meaningful to compare against.
    const userCapitalCategories = await prisma.capitalCategory.findMany({
        where: { userId },
        select: { moneyType: true },
    })
    const hasCategoryOfType = (moneyType: "CASH" | "BANK") =>
        userCapitalCategories.some((c) => c.moneyType === moneyType)

    function computeMoneyTypeBreakdown(moneyType: "CASH" | "BANK") {
        if (!hasCategoryOfType(moneyType)) return { expected: null, actual: null, discrepancy: null }
        // Same guard as the aggregate version: only meaningful with real
        // (non-fallback) current-month capital data and a known previous month.
        if (capitalsAsOfMonth !== null || !prevSheet || !currentSheet) {
            return { expected: null, actual: null, discrepancy: null }
        }

        const prevAmount = prevSheet.capitals
            .filter((c) => c.capitalCategory.moneyType === moneyType)
            .reduce((sum, c) => sum + c.amount, 0)
        const income = currentSheet.transactions
            .filter((t) => t.type === "INCOME" && t.paymentMethod === moneyType)
            .reduce((sum, t) => sum + t.amount, 0)
        const expenses = currentSheet.transactions
            .filter((t) => t.type === "EXPENSE" && t.paymentMethod === moneyType)
            .reduce((sum, t) => sum + t.amount, 0)
        const actual = currentSheet.capitals
            .filter((c) => c.capitalCategory.moneyType === moneyType)
            .reduce((sum, c) => sum + c.amount, 0)

        const expected = prevAmount + income - expenses
        return { expected, actual, discrepancy: actual - expected }
    }

    const cashBreakdown = computeMoneyTypeBreakdown("CASH")
    const bankBreakdown = computeMoneyTypeBreakdown("BANK")

    // Daily activity for the selected month, used by the transactions heatmap.
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const dailyActivity = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        income: 0,
        expenses: 0,
        count: 0,
    }))
    if (currentSheet) {
        for (const t of currentSheet.transactions) {
            const day = new Date(t.date).getDate()
            const entry = dailyActivity[day - 1]
            if (!entry) continue
            if (t.type === "INCOME") entry.income += t.amount
            else entry.expenses += t.amount
            entry.count += 1
        }
    }

    return {
        currentMonth,
        currentYear,
        currentIncome,
        currentExpenses,
        netSaved: currentIncome - currentExpenses,
        savingsRate: currentIncome > 0 ? (currentIncome - currentExpenses) / currentIncome : (currentExpenses > 0 ? -1 : 0),
        prevIncome,
        prevExpenses,
        monthlyTotals,
        categoryBreakdown,
        incomeCategoryBreakdown,
        recentTransactions: recentTransactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            type: t.type,
            date: t.date.toISOString(),
            category: { name: t.category.name, icon: t.category.icon ?? null },
        })),
        capitals,
        totalCapital,
        prevTotalCapital,
        capitalsAsOfMonth,
        capitalsAsOfYear,
        expectedCapital,
        capitalDiscrepancy,
        cashBreakdown,
        bankBreakdown,
        dailyActivity,
    }
}