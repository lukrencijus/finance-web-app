import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/sheets"
import { DashboardClient } from "../../dashboard-client"

export default async function SharedDashboardPage({
    params,
    searchParams,
}: {
    params: Promise<{ userId: string }>
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const { userId: targetUserId } = await params
    const { month: monthParam, year: yearParam } = await searchParams

    const now = new Date()
    const actualCurrentMonth = now.getMonth() + 1
    const actualCurrentYear = now.getFullYear()

    let month = monthParam ? parseInt(monthParam) : actualCurrentMonth
    let year = yearParam ? parseInt(yearParam) : actualCurrentYear

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        month = actualCurrentMonth
        year = actualCurrentYear
    }

    const isActualCurrentMonth = month === actualCurrentMonth && year === actualCurrentYear

    const [data, allSheets] = await Promise.all([
        getDashboardData(targetUserId, month, year),
        prisma.monthlySheet.findMany({
            where: { userId: targetUserId },
            orderBy: [{ year: "desc" }, { month: "desc" }],
            select: { month: true, year: true },
        }),
    ])

    return (
        <DashboardClient
            data={data}
            allSheets={allSheets}
            isActualCurrentMonth={isActualCurrentMonth}
            basePath={`/shared/${targetUserId}`}
        />
    )
}
