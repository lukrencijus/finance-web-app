"use client"

import { useActionState, useEffect, useRef } from "react"
import { createCategory } from "./actions"

export function CreateCategoryForm() {
    const [state, formAction, isPending] = useActionState(createCategory, null)
    const formRef = useRef<HTMLFormElement>(null)

    // Reset form on success
    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset()
        }
    }, [state])

    return (
        <div className="space-y-2">
            <form 
                ref={formRef}
                action={formAction} 
                className="flex flex-wrap gap-3 items-end border rounded-xl p-4 bg-muted/30"
            >
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <input
                        name="name"
                        required
                        placeholder="e.g. Groceries"
                        className="border rounded-md px-3 py-1.5 text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none"
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
                    <label className="text-xs font-medium text-muted-foreground">Icon</label>
                    <input
                        name="icon"
                        placeholder="🥑"
                        className="border rounded-md px-3 py-1.5 text-sm bg-background w-20"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
                >
                    {isPending ? "Adding..." : "Add"}
                </button>
            </form>

            {/* Display Error Message */}
            {state?.error && (
                <p className="text-sm font-medium text-destructive px-1">
                    {state.error}
                </p>
            )}
        </div>
    )
}
