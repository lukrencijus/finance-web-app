import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { createCategory, deleteCategory, updateCategory } from "./actions"

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

            <form action={createCategory} className="flex flex-wrap gap-3 items-end border rounded-xl p-4 bg-muted/30">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <input
                        name="name"
                        required
                        placeholder="e.g. Groceries"
                        className="border rounded-md px-3 py-1.5 text-sm bg-background"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <select name="type" className="border rounded-md px-3 py-1.5 text-sm bg-background">
                        <option value="EXPENSE">Expense</option>
                        <option value="INCOME">Income</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Icon (emoji)</label>
                    <input
                        name="icon"
                        placeholder="🛒"
                        className="border rounded-md px-3 py-1.5 text-sm bg-background w-20"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm hover:opacity-90"
                >
                    Add
                </button>
            </form>

            <CategorySection
                title="Income"
                color="green"
                categories={income}
            />

            <CategorySection
                title="Expenses"
                color="red"
                categories={expense}
            />
        </div>
    )
}

type Category = {
    id: string
    name: string
    type: string
    icon: string | null
}

function CategorySection({
    title,
    color,
    categories,
}: {
    title: string
    color: "green" | "red"
    categories: Category[]
}) {
    const badge =
        color === "green"
            ? "border-green-300 text-green-700 bg-green-50"
            : "border-red-300 text-red-700 bg-red-50"

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
                <div className="rounded-xl border overflow-hidden bg-background">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-2">Icon</th>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} className="border-b last:border-b-0">
                                    <td className="px-4 py-2 text-lg">{cat.icon ?? "—"}</td>
                                    <td className="px-4 py-2">{cat.name}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <form action={updateCategory.bind(null, cat.id)} className="flex gap-2">
                                                <input
                                                    name="name"
                                                    defaultValue={cat.name}
                                                    className="border rounded px-2 py-0.5 text-xs bg-background w-28"
                                                />
                                                <input
                                                    name="icon"
                                                    defaultValue={cat.icon ?? ""}
                                                    placeholder="emoji"
                                                    className="border rounded px-2 py-0.5 text-xs bg-background w-14"
                                                />
                                                <button
                                                    type="submit"
                                                    className="rounded border px-2 py-0.5 text-xs hover:bg-muted"
                                                >
                                                    Save
                                                </button>
                                            </form>
                                            <form action={deleteCategory.bind(null, cat.id)}>
                                                <button
                                                    type="submit"
                                                    className="rounded border border-destructive px-2 py-0.5 text-xs text-destructive hover:bg-muted"
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}