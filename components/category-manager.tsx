"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { CategoryManagerContent, type Category } from "./category-manager-content"

export function CategoryManager({ type, categories }: {
    type: "INCOME" | "EXPENSE"
    categories: Category[]
}) {
    const [open, setOpen] = useState(false)

    // Only show the relevant type inside the modal
    const filtered = categories.filter(c => c.type === type)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
                Manage
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-background border rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-base">
                                {type === "INCOME" ? "Income" : "Expense"} Categories
                            </h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            <CategoryManagerContent categories={filtered} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}