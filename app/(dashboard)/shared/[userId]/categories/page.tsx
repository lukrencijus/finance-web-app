import { prisma } from "@/lib/prisma"

export default async function SharedCategoriesPage({
    params,
}: {
    params: Promise<{ userId: string }>
}) {
    const { userId: targetUserId } = await params

    const categories = await prisma.category.findMany({
        where: { userId: targetUserId },
        orderBy: [
            { order: { sort: "asc", nulls: "last" } },
            { createdAt: "desc" },
        ],
    })

    const income = categories.filter(c => c.type === "INCOME")
    const expense = categories.filter(c => c.type === "EXPENSE")

    return (
        <div className="max-w-lg mx-auto py-8 space-y-8">
            <h1 className="text-3xl font-semibold">Transaction Categories</h1>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Income</h2>
                {income.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No income categories.</p>
                ) : (
                    <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                        {income.map(c => (
                            <li key={c.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                                <span>{c.icon}</span>
                                <span className="text-sm font-medium text-foreground">{c.name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Expenses</h2>
                {expense.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No expense categories.</p>
                ) : (
                    <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                        {expense.map(c => (
                            <li key={c.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                                <span>{c.icon}</span>
                                <span className="text-sm font-medium text-foreground">{c.name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}