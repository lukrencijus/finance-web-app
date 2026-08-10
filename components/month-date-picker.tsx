"use client"

import { useEffect, useRef, useState } from "react"
import { CalendarDays } from "lucide-react"
import { formatDate, toISODate } from "@/lib/utils"

type Props = {
    /** 1-12. The only month the picker can select from. */
    month: number
    year: number
    /** Earliest selectable date, "YYYY-MM-DD". */
    min: string
    /** Latest selectable date, "YYYY-MM-DD". */
    max: string
    defaultValue: string
    /** Form field name. Defaults to "date". */
    name?: string
    /** Tightens padding to match the inline edit form. */
    compact?: boolean
}

// Monday-first, matching Lithuanian convention. The native <input type="date">
// picker cannot be forced to this - the browser derives week start from the
// OS/browser locale - which is the whole reason this component exists.
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

/** Weekday of the 1st, as an offset from Monday (Mon = 0 ... Sun = 6). */
function mondayOffset(year: number, month: number): number {
    return (new Date(year, month - 1, 1).getDay() + 6) % 7
}

export function MonthDatePicker({
    month,
    year,
    min,
    max,
    defaultValue,
    name = "date",
    compact = false,
}: Props) {
    const [value, setValue] = useState(defaultValue)
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            if (rootRef.current?.contains(e.target as Node)) return
            setIsOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false)
        }
        document.addEventListener("mousedown", onPointerDown)
        document.addEventListener("touchstart", onPointerDown)
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("mousedown", onPointerDown)
            document.removeEventListener("touchstart", onPointerDown)
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [isOpen])

    const lastDay = new Date(year, month, 0).getDate()
    const leading = mondayOffset(year, month)
    const selectedDay = value.startsWith(`${year}-${String(month).padStart(2, "0")}-`)
        ? parseInt(value.slice(8, 10), 10)
        : null

    const today = toISODate(new Date())
    const todayInRange = today >= min && today <= max

    const padding = compact ? "px-2 py-1.5" : "px-3 py-2"

    return (
        <div ref={rootRef} className="relative">
            <input type="hidden" name={name} value={value} />

            <button
                type="button"
                onClick={() => setIsOpen(o => !o)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                className={`w-full flex items-center justify-between gap-2 border border-input bg-background text-foreground rounded-xl ${padding} text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring`}
            >
                <span>{formatDate(value)}</span>
                <CalendarDays className="size-4 text-muted-foreground shrink-0" />
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    className="absolute z-50 mt-1 w-[17.5rem] rounded-xl border border-border bg-card shadow-lg p-3"
                >
                    <p className="text-xs font-medium text-foreground mb-2 text-center">
                        {MONTH_NAMES[month - 1]} {year}
                    </p>

                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {WEEKDAYS.map(d => (
                            <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: leading }, (_, i) => <div key={`pad-${i}`} />)}
                        {Array.from({ length: lastDay }, (_, i) => {
                            const day = i + 1
                            const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                            const disabled = iso < min || iso > max
                            const isSelected = day === selectedDay
                            const isToday = iso === today
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => { setValue(iso); setIsOpen(false) }}
                                    className={`h-8 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : isToday
                                                ? "text-foreground ring-1 ring-inset ring-border hover:bg-muted"
                                                : "text-foreground hover:bg-muted"
                                    }`}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>

                    {todayInRange && (
                        <button
                            type="button"
                            onClick={() => { setValue(today); setIsOpen(false) }}
                            className="w-full mt-2 text-xs font-medium text-muted-foreground hover:text-foreground py-1 transition-colors"
                        >
                            Today
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
