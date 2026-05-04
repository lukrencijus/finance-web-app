"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { CapitalCategoryManagerContent, type CapitalCategory } from "./capital-category-manager-content"

export function CapitalCategoryManager({ categories }: { categories: CapitalCategory[] }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
                Manage
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg tracking-tight">Capital Categories</h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <CapitalCategoryManagerContent categories={categories} />
                        </div>
                        <div className="mt-6 pt-4 border-t border-border">
                            <button
                                onClick={() => setOpen(false)}
                                className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}