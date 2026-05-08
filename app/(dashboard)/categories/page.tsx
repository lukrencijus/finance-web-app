import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { CategoryManagerContent } from "@/components/category-manager-content"
export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
    const user = await getCurrentDbUser()
    const categories = await prisma.category.findMany({
        where: { userId: user.id },
        orderBy: [
            {
                order: {
                    sort: 'asc',
                    nulls: 'last', 
                },
            },
            {
                createdAt: 'desc',
            },
        ],
    })

    return (
        <div className="max-w-lg mx-auto py-8 space-y-2">
            <h1 className="text-3xl font-semibold mb-8">Transaction Categories</h1>
            <CategoryManagerContent categories={categories} />
        </div>
    )
}