import { prisma } from "@/lib/prisma"

export async function getCurrentMonthSheet(userId: string) {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

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