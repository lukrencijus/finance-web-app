"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from "lucide-react"

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

type SheetSummary = { month: number; year: number }

export function MonthPicker({
    allSheets,
    currentMonth,
    currentYear,
    basePath,
    isActualCurrentMonth,
}: {
    allSheets: SheetSummary[]
    currentMonth: number
    currentYear: number
    /** Route to build month/year links against, e.g. "/monthly-sheet", "/shared/<id>/monthly-sheet", "/" */
    basePath: string
    isActualCurrentMonth?: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [viewYear, setViewYear] = useState(currentYear)

    const today = new Date()
    const thisMonth = today.getMonth() + 1
    const thisYear = today.getFullYear()

    useEffect(() => {
        // Reset the picker back to the selected year whenever it's closed,
        // so reopening it doesn't strand the user on a year they were just browsing.
        if (!isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setViewYear(currentYear)
        }
    }, [isOpen, currentYear])

    const hasSheet = (m: number, y: number) =>
        allSheets.some(s => s.month === m && s.year === y)

    const hrefFor = (m: number, y: number) => {
        const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath
        return `${base}?month=${m}&year=${y}`
    }

    const currentMonthHref = basePath

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="group flex items-center justify-center gap-x-4 w-full px-4 py-3 rounded-2xl bg-card border border-border hover:bg-muted active:bg-muted/50 transition-all focus:outline-none shadow-sm"
            >
                <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <CalendarIcon className="size-5 text-primary" />
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-xl font-bold text-foreground tabular-nums">
                            {MONTH_NAMES[currentMonth - 1]} {currentYear}
                        </span>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                </div>
                {isActualCurrentMonth && (
                    <span className="text-xs font-normal bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-xl border border-blue-500/20">
                        Current
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100] lg:z-10 bg-background/60 backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Picker Container*/}
                    <div className="fixed inset-x-0 bottom-0 z-[101] lg:absolute lg:inset-auto lg:left-1/2 lg:-translate-x-1/2 lg:top-full lg:mt-2 w-full lg:w-80 bg-card border-t lg:border border-border shadow-[0_-8px_30px_rgb(0,0,0,0.12)] lg:shadow-xl rounded-t-[2.5rem] lg:rounded-2xl p-6 lg:p-4 animate-in slide-in-from-bottom lg:slide-in-from-top-2 lg:fade-in duration-300 lg:duration-200">

                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 lg:hidden" />

                        <div className="flex items-center justify-between mb-6 lg:mb-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); setViewYear(v => v - 1) }}
                                className="p-3 lg:p-1.5 hover:bg-muted rounded-xl transition-colors"
                            >
                                <ChevronLeft className="size-5 lg:size-4" />
                            </button>
                            <span className="font-bold text-lg lg:text-sm tabular-nums">{viewYear}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setViewYear(v => v + 1) }}
                                className="p-3 lg:p-1.5 hover:bg-muted rounded-xl transition-colors"
                            >
                                <ChevronRight className="size-5 lg:size-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 lg:gap-2">
                            {MONTH_NAMES.map((name, index) => {
                                const m = index + 1
                                const isSelected = currentMonth === m && currentYear === viewYear
                                const isToday = thisMonth === m && thisYear === viewYear
                                const exists = hasSheet(m, viewYear)

                                return (
                                    <Link
                                        key={name}
                                        href={hrefFor(m, viewYear)}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                                            relative py-5 lg:py-3 rounded-2xl lg:rounded-xl text-sm lg:text-xs font-semibold flex flex-col items-center justify-center transition-all active:scale-95
                                            ${isSelected
                                                ? "bg-primary text-primary-foreground shadow-lg lg:shadow-sm"
                                                : "bg-muted/30 lg:bg-transparent hover:bg-muted text-foreground"
                                            }
                                            ${!exists && !isSelected ? "opacity-30" : "opacity-100"}
                                        `}
                                    >
                                        {name.substring(0, 3)}
                                        <div className="absolute bottom-2 lg:bottom-1.5 flex gap-1">
                                            {isToday && (
                                                <span className={`size-1.5 lg:size-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-blue-500"}`} />
                                            )}
                                            {exists && !isSelected && (
                                                <span className="size-1.5 lg:size-1 rounded-full bg-muted-foreground/40" />
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>

                        <div className="mt-6 lg:mt-4 pt-6 lg:pt-4 border-t border-border flex flex-col items-center gap-4">
                            <Link
                                href={currentMonthHref}
                                onClick={() => setIsOpen(false)}
                                className="w-full lg:w-auto min-w-[160px] text-center px-6 py-3 lg:py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-2xl lg:rounded-xl transition-all active:scale-95"
                            >
                                Go to Current Month
                            </Link>

                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-blue-500" /> Today
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-muted-foreground/40" /> Recorded Data
                                </span>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="lg:hidden text-xs font-bold text-muted-foreground/60 uppercase tracking-widest pt-2"
                            >
                                Close Picker
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
