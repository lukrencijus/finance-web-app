import { getCurrentDbUser } from "@/lib/current-user"
import { getCurrentMonthSheet } from "@/lib/sheets"
import { MonthlySheetClient } from "./monthly-sheet-client"
import { prisma } from "@/lib/prisma"

export default async function MonthlySheetPage() {
    const user = await getCurrentDbUser()

    const [sheet, categories] = await Promise.all([
        getCurrentMonthSheet(user.id),
        prisma.category.findMany({
            where: { userId: user.id },
            orderBy: { name: "asc" },
        }),
    ])

    if (!sheet) {
        return <div className="p-6">Could not load sheet. Try refreshing.</div>
    }

    return <MonthlySheetClient sheet={sheet} categories={categories} />
}