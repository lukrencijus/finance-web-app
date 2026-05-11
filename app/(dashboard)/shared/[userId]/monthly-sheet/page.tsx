import { getCurrentDbUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { getMonthSheet } from "@/lib/sheets"
import { MonthlySheetClient } from "@/app/(dashboard)/monthly-sheet/monthly-sheet-client"

export default async function SharedMonthlySheetPage({
    params,
    searchParams,
}: {
    params: Promise<{ userId: string }>
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const { userId: targetUserId } = await params
    const { month: sMonth, year: sYear } = await searchParams
    const currentUser = await getCurrentDbUser()

    const access = await prisma.sharedAccess.findUnique({
        where: {
            ownerId_sharedWithId: {
                ownerId: targetUserId,
                sharedWithId: currentUser.id,
            },
        },
    })

    const now = new Date()
    const month = sMonth ? parseInt(sMonth) : now.getMonth() + 1
    const year = sYear ? parseInt(sYear) : now.getFullYear()

    const sheet = await getMonthSheet(targetUserId, month, year)
    const categories = await prisma.category.findMany({ where: { userId: targetUserId } })
    const capitalCategories = await prisma.capitalCategory.findMany({ where: { userId: targetUserId } })
    const allSheets = await prisma.monthlySheet.findMany({
        where: { userId: targetUserId },
        select: { month: true, year: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
    })

    return (
        <MonthlySheetClient
            sheet={sheet}
            categories={categories}
            capitalCategories={capitalCategories}
            allSheets={allSheets}
            month={month}
            year={year}
            isCurrentMonth={month === now.getMonth() + 1 && year === now.getFullYear()}
            isFuture={year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)}
            serverCurrentMonth={now.getMonth() + 1}
            serverCurrentYear={now.getFullYear()}
            readOnly={access?.permission === "VIEW"}
            userId={targetUserId}
        />
    )
}