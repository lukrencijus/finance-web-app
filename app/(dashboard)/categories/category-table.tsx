"use client"
import { useState, Fragment } from "react"
import { updateCategory, deleteCategory } from "./actions"

type Category = {
    id: string
    name: string
    type: string
    icon: string | null
}

export function CategoryTable({ categories }: { categories: Category[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    return (
        <div className="rounded-xl border overflow-hidden bg-background">
            <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/50">
                    <tr>
                        <th className="px-4 py-3 w-16 text-center">Icon</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat) => {
                        const isExpanded = expandedId === cat.id

                        return (
                            <Fragment key={cat.id}>
                                {/* Display Row */}
                                <tr className={`border-b last:border-b-0 transition-colors ${isExpanded ? "bg-muted/30" : "hover:bg-muted/10"}`}>
                                    <td className="px-4 py-3 text-lg text-center">{cat.icon ?? "-"}</td>
                                    <td className="px-4 py-3 font-medium">{cat.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                                                className="rounded border px-3 py-1 text-xs hover:bg-background"
                                            >
                                                {isExpanded ? "Close" : "Edit"}
                                            </button>
                                            <form action={deleteCategory.bind(null, cat.id)}>
                                                <button
                                                    type="submit"
                                                    className="rounded border border-destructive/20 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>

                                {/* Expanded Edit Row */}
                                {isExpanded && (
                                    <tr className="border-b bg-muted/20 shadow-inner">
                                        <td colSpan={3} className="px-8 py-4">
                                            <form 
                                                action={async (formData) => {
                                                    await updateCategory(cat.id, formData)
                                                    setExpandedId(null) // Close after save
                                                }}
                                                className="flex flex-wrap items-end gap-4"
                                            >
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Icon</label>
                                                    <input
                                                        name="icon"
                                                        defaultValue={cat.icon ?? ""}
                                                        placeholder="e.g. 🥑"
                                                        className="border rounded-md px-3 py-1.5 text-sm bg-background w-20"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                                                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Category Name</label>
                                                    <input
                                                        name="name"
                                                        defaultValue={cat.name}
                                                        className="border rounded-md px-3 py-1.5 text-sm bg-background w-full"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-xs font-medium hover:opacity-90"
                                                >
                                                    Save Changes
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
