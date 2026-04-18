import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { createCategory } from "./actions"
import { CategoryTable } from "./category-table"
import { CreateCategoryForm } from "./create-category-form"

export default async function CategoriesPage() {
    const user = await getCurrentDbUser()
    const categories = await prisma.category.findMany({
        where: { userId: user.id },
        orderBy: [{ type: "asc" }, { name: "asc" }],
    })

    const income = categories.filter((c) => c.type === "INCOME")
    const expense = categories.filter((c) => c.type === "EXPENSE")

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-10">
            <h1 className="text-3xl font-semibold">Categories</h1>

            <CreateCategoryForm />

            <CategorySection title="Income" color="green" categories={income} />
            <CategorySection title="Expenses" color="red" categories={expense} />
        </div>
    )
}

function CategorySection({ title, color, categories }: { title: string, color: "green" | "red", categories: any[] }) {
    const badge = color === "green" ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium">{title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${badge}`}>
                    {categories.length}
                </span>
            </div>
            {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No {title.toLowerCase()} categories yet.</p>
            ) : (
                <CategoryTable categories={categories} />
            )}
        </section>
    )
}
