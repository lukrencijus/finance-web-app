import { getCurrentDbUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { RecurringTransactionsClient } from "./recurring-transactions-client"

export default async function RecurringTransactionsPage() {
    const user = await getCurrentDbUser()

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Fetch all recurring transactions across all sheets for this user
    const transactions = await prisma.transaction.findMany({
        where: {
            isRecurring: true,
            monthlySheet: { userId: user.id },
        },
        include: {
            category: true,
            monthlySheet: { select: { month: true, year: true } },
        },
        orderBy: [
            { monthlySheet: { year: "desc" } },
            { monthlySheet: { month: "desc" } },
            { createdAt: "desc" },
        ],
    })

    // Keep only the most recent instance per "signature" (categoryId + amount + description)
    // This gives us the "active" recurring list without duplicates
    const seen = new Set<string>()
    const unique = transactions.filter(t => {
        const key = `${t.categoryId}|${t.amount}|${t.description ?? ""}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })

    const income = unique.filter(t => t.type === "INCOME")
    const expenses = unique.filter(t => t.type === "EXPENSE")

    return (
        <RecurringTransactionsClient
            income={income}
            expenses={expenses}
            currentMonth={currentMonth}
            currentYear={currentYear}
        />
    )
}