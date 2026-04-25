import { prisma } from "@/lib/prisma"

export async function getCurrentMonthSheet(userId: string, month: number, year: number) {
    // receives month/year from caller
    let sheet = await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month, year, userId } },
        include: {
            transactions: {
                include: { category: true },
                orderBy: { date: "desc" },
            },
        },
    })
    if (!sheet) {
        sheet = await prisma.monthlySheet.create({
            data: { month, year, userId },
            include: {
                transactions: {
                    include: { category: true },
                    orderBy: { date: "desc" },
                },
            },
        })
    }
    return sheet
}

export async function getMonthSheet(userId: string, month: number, year: number) {
    return await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month, year, userId } },
        include: {
            transactions: {
                include: { category: true },
                orderBy: { date: "desc" },
            },
        },
    })
}

export async function getDashboardData(userId: string) {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Build last 6 months (including current) in descending order
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
            capitals: true,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    })

    // Current sheet (most recent)
    const currentSheet = sheets.find(
        (s) => s.month === currentMonth && s.year === currentYear
    ) ?? null

    // Per-month totals for chart (oldest -> newest)
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
            return { month, year, income, expenses }
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

    // Recent transactions (current sheet, last 5)
    const recentTransactions = currentSheet
        ? currentSheet.transactions.slice(0, 5).map((t) => ({
              id: t.id,
              description: t.description,
              amount: t.amount,
              type: t.type,
              date: t.date.toISOString(),
              category: { name: t.category.name, icon: t.category.icon ?? null },
          }))
        : []

    // Capital breakdown (current sheet)
    const capitals = currentSheet
        ? currentSheet.capitals.map((c) => ({
              id: c.id,
              name: c.name,
              amount: c.amount,
          }))
        : []
    const totalCapital = capitals.reduce((sum, c) => sum + c.amount, 0)

    return {
        currentMonth,
        currentYear,
        currentIncome,
        currentExpenses,
        netSaved: currentIncome - currentExpenses,
        savingsRate: currentIncome > 0 ? (currentIncome - currentExpenses) / currentIncome : 0,
        prevIncome,
        prevExpenses,
        monthlyTotals,
        categoryBreakdown,
        recentTransactions,
        capitals,
        totalCapital,
    }
}