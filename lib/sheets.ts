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