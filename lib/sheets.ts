import { prisma } from "@/lib/prisma"

export async function ensureCurrentMonthSheet(userId: string) {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const existing = await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month, year, userId } },
    })

    if (!existing) {
        await prisma.monthlySheet.create({
            data: { month, year, userId },
        })
    }
}