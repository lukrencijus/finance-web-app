import { getCurrentDbUser } from "@/lib/current-user"
import { getCurrentMonthSheet, getMonthSheet } from "@/lib/sheets"
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

    const [sheet, categories, capitalCategories, allSheets] = await Promise.all([
        isCurrentMonth
            ? getCurrentMonthSheet(user.id, currentMonth, currentYear)
            : getMonthSheet(user.id, month, year),
        prisma.category.findMany({
            where: { userId: user.id },
            orderBy: [
                { order: { sort: "asc", nulls: "last" } },
                { createdAt: "desc" },
            ],
        }),
        prisma.capitalCategory.findMany({
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
            capitalCategories={capitalCategories}
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