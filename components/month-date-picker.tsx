"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
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
    const triggerRef = useRef<HTMLButtonElement>(null)
    // Both panels exist in the DOM at once (one hidden per breakpoint), so they
    // need separate refs - a shared one would only ever point at the last render.
    const popoverRef = useRef<HTMLDivElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node
            if (popoverRef.current?.contains(target)) return
            if (sheetRef.current?.contains(target)) return
            if (triggerRef.current?.contains(target)) return
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

    const calendar = (
        <>
            <p className="text-base lg:text-sm font-semibold lg:font-medium text-foreground mb-4 lg:mb-3 text-center">
                {MONTH_NAMES[month - 1]} {year}
            </p>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-xs lg:text-[10px] font-medium text-muted-foreground text-center py-1">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 lg:gap-1">
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
                            // Comfortable tap targets on mobile, compact on desktop.
                            className={`h-12 lg:h-8 rounded-xl lg:rounded-lg text-lg lg:text-xs font-medium tabular-nums transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : isToday
                                        ? "text-foreground ring-1 ring-inset ring-border active:bg-muted lg:hover:bg-muted"
                                        : "text-foreground active:bg-muted lg:hover:bg-muted"
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
                    className="w-full mt-3 text-sm lg:text-xs font-medium text-muted-foreground active:text-foreground lg:hover:text-foreground py-3 lg:py-2 transition-colors"
                >
                    Today
                </button>
            )}
        </>
    )

    return (
        <div className="relative">
            <input type="hidden" name={name} value={value} />

            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(o => !o)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                className={`w-full flex items-center justify-between gap-2 border border-input bg-background text-foreground rounded-xl ${padding} text-base lg:text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring`}
            >
                {/* "2026-08-10" at 16px only just fits a half-width column on a
                    phone; without nowrap it wrapped to two lines and made this
                    control taller than the amount field beside it. */}
                <span className="whitespace-nowrap tabular-nums truncate">{formatDate(value)}</span>
                <CalendarDays className="size-4 text-muted-foreground shrink-0" />
            </button>

            {/*
             * Desktop: an absolutely positioned popover next to the trigger.
             *
             * Mobile: portalled to <body> as a bottom sheet. It cannot stay in
             * place here - the add-transaction sheet that usually wraps this
             * field both scrolls (overflow-y-auto) and animates (a transform,
             * which makes it a containing block even for position: fixed), so
             * an in-place panel gets clipped by its own parent.
             */}
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="hidden lg:block absolute z-50 mt-1 w-[17.5rem] rounded-xl border border-border bg-card shadow-lg p-3"
                >
                    {calendar}
                </div>
            )}

            {/* Safe without a mounted flag: isOpen only ever flips on a click,
                which cannot happen during SSR. */}
            {isOpen && typeof document !== "undefined" && createPortal(
                <div className="lg:hidden">
                    {/*
                     * z-index is set inline rather than with a Tailwind class.
                     * This sheet has to clear the add-transaction sheet it is
                     * opened from (z-100/101), and an inline style cannot be
                     * lost to a stale CSS bundle - which a home-screen webclip
                     * will happily serve for a long time.
                     */}
                    <div
                        style={{ zIndex: 300 }}
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        ref={sheetRef}
                        role="dialog"
                        aria-modal="true"
                        style={{ zIndex: 301 }}
                        className="fixed inset-x-0 bottom-0 bg-card border-t border-border rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 pb-8"
                    >
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5" />
                        {calendar}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
