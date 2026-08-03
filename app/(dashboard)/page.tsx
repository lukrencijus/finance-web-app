import { getCurrentDbUser } from "@/lib/current-user"
import { getDashboardData } from "@/lib/sheets"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "./dashboard-client"

type Props = {
    searchParams: Promise<{ month?: string; year?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
    const user = await getCurrentDbUser()
    const { month: monthParam, year: yearParam } = await searchParams

    const now = new Date()
    const actualCurrentMonth = now.getMonth() + 1
    const actualCurrentYear = now.getFullYear()

    let month = monthParam ? parseInt(monthParam) : actualCurrentMonth
    let year = yearParam ? parseInt(yearParam) : actualCurrentYear

    // invalid params, just go to current month
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        month = actualCurrentMonth
        year = actualCurrentYear
    }

    const isActualCurrentMonth = month === actualCurrentMonth && year === actualCurrentYear

    const [data, allSheets] = await Promise.all([
        getDashboardData(user.id, month, year),
        prisma.monthlySheet.findMany({
            where: { userId: user.id },
            orderBy: [{ year: "desc" }, { month: "desc" }],
            select: { month: true, year: true },
        }),
    ])

    return (
        <DashboardClient
            data={data}
            allSheets={allSheets}
            isActualCurrentMonth={isActualCurrentMonth}
        />
    )
}
