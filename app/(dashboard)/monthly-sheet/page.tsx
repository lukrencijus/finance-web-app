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

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        month = currentMonth
        year = currentYear
    }
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
        month = currentMonth
        year = currentYear
    }

    const isCurrentMonth = month === currentMonth && year === currentYear

    const [sheet, categories, allSheets] = await Promise.all([
        isCurrentMonth
            ? getCurrentMonthSheet(user.id)
            : getMonthSheet(user.id, month, year),
        prisma.category.findMany({
            where: { userId: user.id },
            orderBy: { name: "asc" },
        }),
        // fetch all sheets this user has
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
        />
    )
}