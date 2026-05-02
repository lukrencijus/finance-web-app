import { getCurrentDbUser } from "@/lib/current-user"
import { getMonthSheet } from "@/lib/sheets"
import { MonthlySheetClient } from "./monthly-sheet-client"
import { prisma } from "@/lib/prisma"

type Props = {
    searchParams: Promise<{ month?: string; year?: string }>
}

export default async function MonthlySheetPage({ searchParams }: Props) {
    const user = await getCurrentDbUser()
    const { month: monthParam, year: yearParam } = await searchParams

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    let month = monthParam ? parseInt(monthParam) : currentMonth
    let year = yearParam ? parseInt(yearParam) : currentYear

    // invalid params, just go to current month
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        month = currentMonth
        year = currentYear
    }

    const isFuture = year > currentYear || (year === currentYear && month > currentMonth)
    const isCurrentMonth = month === currentMonth && year === currentYear

    if (isCurrentMonth) {
        await prisma.monthlySheet.upsert({
            where: { month_year_userId: { month: currentMonth, year: currentYear, userId: user.id } },
            create: { month: currentMonth, year: currentYear, userId: user.id },
            update: {},
        })
    }

    const [sheet, categories, allSheets] = await Promise.all([
        isFuture
            ? null
            : prisma.monthlySheet.findUnique({
                where: { month_year_userId: { month, year, userId: user.id } },
                include: {
                    transactions: {
                        include: { category: true },
                        orderBy: [{ createdAt: "desc" }, { date: "desc" }],
                    },
                    capitals: { orderBy: { id: "asc" } },
                },
            }),
        prisma.category.findMany({
            where: { userId: user.id },
            orderBy: [
                { order: { sort: "asc", nulls: "last" } },
                { createdAt: "desc" },
            ],
        }),
        prisma.monthlySheet.findMany({
            where: { userId: user.id },
            orderBy: [{ year: "desc" }, { month: "desc" }],
            select: { month: true, year: true },
        }),
    ])

    return (
        <MonthlySheetClient
            sheet={sheet}
            categories={categories}
            allSheets={allSheets}
            month={month}
            year={year}
            isCurrentMonth={isCurrentMonth}
            isFuture={isFuture}
            serverCurrentMonth={currentMonth}
            serverCurrentYear={currentYear}
        />
    )
}