import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { CapitalCategoryManagerContent } from "@/components/capital-category-manager-content"

export const dynamic = "force-dynamic"

export default async function CapitalsPage() {
    const user = await getCurrentDbUser()

    const categories = await prisma.capitalCategory.findMany({
        where: { userId: user.id },
        orderBy: [
            { order: { sort: "asc", nulls: "last" } },
            { createdAt: "desc" },
        ],
    })

    return (
        <div className="max-w-lg mx-auto py-8 space-y-2">
            <h1 className="text-3xl font-semibold mb-8">Capital Categories</h1>
            <CapitalCategoryManagerContent categories={categories} />
        </div>
    )
}