import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Lithuanian number formatting: comma as the decimal separator, space as the
// thousands separator (e.g. 1234.5 -> "1 234,50"). Use for any amount shown to the user.
export function formatCurrency(amount: number): string {
  return "€" + amount.toLocaleString("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * "YYYY-MM-DD" from a date's *local* parts.
 *
 * Deliberately not `toISOString().split("T")[0]`, which converts to UTC first -
 * in Lithuania (UTC+2/+3) that returns yesterday's date for any local time
 * before 02:00 or 03:00, silently filing transactions into the wrong day.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Full date for display, e.g. "2026-08-10".
 *
 * That is the Lithuanian (lt-LT) convention. Built by hand rather than via
 * `toLocaleDateString` so server and client always agree - a locale-dependent
 * result rendered on both sides is a hydration mismatch waiting to happen.
 */
export function formatDate(date: Date | string): string {
  // An already-plain "YYYY-MM-DD" string is passed through untouched: routing it
  // via `new Date()` would parse it as UTC midnight and shift the day in western
  // timezones.
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10)
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""
  return toISODate(d)
}

/** Compact date for dense lists, e.g. "08-10" (month-day, Lithuanian order). */
export function formatDateShort(date: Date | string): string {
  const iso = formatDate(date)
  return iso ? iso.slice(5) : ""
}
