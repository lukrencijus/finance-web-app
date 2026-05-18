import { getCurrentDbUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { RecurringTransactionsClient } from "./recurring-transactions-client"

export default async function RecurringTransactionsPage() {
    const user = await getCurrentDbUser()
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Only look at the current month's sheet - these are what will repeat next month
    // Fall back to the most recent sheet if no current month sheet exists yet
    const currentSheet = await prisma.monthlySheet.findUnique({
        where: {
            month_year_userId: {
                month: currentMonth,
                year: currentYear,
                userId: user.id,
            },
        },
    })

    const sheetFilter = currentSheet
        ? { monthlySheetId: currentSheet.id }
        : {
              monthlySheet: {
                  userId: user.id,
                  OR: [
                      { year: { lt: currentYear } },
                      { year: currentYear, month: { lt: currentMonth } },
                  ],
              },
          }

    const transactions = await prisma.transaction.findMany({
        where: {
            isRecurring: true,
            ...sheetFilter,
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
        // If falling back to recent sheets, still only take from the single most recent one
        ...(currentSheet ? {} : { take: undefined }),
    })

    // If no current sheet, keep only transactions from the single most recent month
    const filtered = currentSheet
        ? transactions
        : (() => {
              if (transactions.length === 0) return []
              const { month, year } = transactions[0].monthlySheet
              return transactions.filter(
                  t => t.monthlySheet.month === month && t.monthlySheet.year === year
              )
          })()

    const income = filtered.filter(t => t.type === "INCOME")
    const expenses = filtered.filter(t => t.type === "EXPENSE")

    return (
        <RecurringTransactionsClient
            income={income}
            expenses={expenses}
            currentMonth={currentMonth}
            currentYear={currentYear}
        />
    )
}