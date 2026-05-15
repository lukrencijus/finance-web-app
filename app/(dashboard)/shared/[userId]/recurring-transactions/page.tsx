import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { RefreshCw } from "lucide-react"

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

type Props = {
    params: Promise<{ userId: string }>
}

export default async function SharedRecurringTransactionsPage({ params }: Props) {
    const { userId } = await params
    const currentUser = await getCurrentDbUser()

    // Verify shared access exists
    const access = await prisma.sharedAccess.findUnique({
        where: {
            ownerId_sharedWithId: {
                ownerId: userId,
                sharedWithId: currentUser.id,
            },
        },
        include: { owner: { select: { name: true } } },
    })

    if (!access) {
        return (
            <div className="max-w-lg mx-auto py-8">
                <p className="text-muted-foreground text-sm">Access denied.</p>
            </div>
        )
    }

    const transactions = await prisma.transaction.findMany({
        where: {
            isRecurring: true,
            monthlySheet: { userId },
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

    // Deduplicate - most recent instance per signature
    const seen = new Set<string>()
    const unique = transactions.filter(t => {
        const key = `${t.categoryId}|${t.amount}|${t.description ?? ""}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })

    const income = unique.filter(t => t.type === "INCOME")
    const expenses = unique.filter(t => t.type === "EXPENSE")
    const totalCount = unique.length
    const ownerName = access.owner.name ?? "This user"

    return (
        <div className="max-w-lg mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-semibold">Recurring Transactions</h1>
                <p className="text-sm text-muted-foreground mt-1">{ownerName}'s recurring transactions</p>
            </div>

            {totalCount === 0 ? (
                <div className="bg-card rounded-xl p-10 shadow-sm border border-border text-center">
                    <RefreshCw className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-lg font-medium text-foreground mb-1">No recurring transactions</p>
                    <p className="text-sm text-muted-foreground">{ownerName} has no recurring transactions set up.</p>
                </div>
            ) : (
                <>
                    {income.length > 0 && (
                        <Section title="Income" type="INCOME" transactions={income} />
                    )}
                    {expenses.length > 0 && (
                        <Section title="Expenses" type="EXPENSE" transactions={expenses} />
                    )}
                </>
            )}
        </div>
    )
}

function Section({ title, type, transactions }: {
    title: string
    type: "INCOME" | "EXPENSE"
    transactions: { id: string; amount: number; description: string | null; type: string; category: { name: string; icon: string | null }; monthlySheet: { month: number; year: number } }[]
}) {
    const badgeClass = type === "INCOME"
        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
        : "bg-destructive/10 text-destructive border-destructive/20"

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {transactions.length}
                </span>
            </div>
            <ul className="divide-y divide-border">
                {transactions.map(t => (
                    <li key={t.id} className="flex items-center gap-3 px-6 py-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <RefreshCw className="size-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">
                                {t.category.icon} {t.category.name}
                            </p>
                            {t.description && (
                                <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                                Since {MONTH_NAMES[t.monthlySheet.month - 1]} {t.monthlySheet.year}
                            </p>
                        </div>
                        <span className={`font-semibold text-sm shrink-0 ${
                            t.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-destructive"
                        }`}>
                            {t.type === "INCOME" ? "+" : "-"}€{t.amount.toFixed(2)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}