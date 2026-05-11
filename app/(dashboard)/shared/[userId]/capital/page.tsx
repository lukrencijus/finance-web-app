import { prisma } from "@/lib/prisma"

export default async function SharedCapitalPage({
    params,
}: {
    params: Promise<{ userId: string }>
}) {
    const { userId: targetUserId } = await params

    const categories = await prisma.capitalCategory.findMany({
        where: { userId: targetUserId },
        orderBy: [
            { order: { sort: "asc", nulls: "last" } },
            { createdAt: "desc" },
        ],
    })

    return (
        <div className="max-w-lg mx-auto py-8 space-y-6">
            <h1 className="text-3xl font-semibold">Capital Categories</h1>
            {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No capital categories.</p>
            ) : (
                <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                    {categories.map(c => (
                        <li key={c.id} className="flex items-center gap-3 px-4 py-3 bg-card">
                            <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: c.color }}
                            />
                            <span className="text-sm font-medium text-foreground">
                                {c.icon} {c.name}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}