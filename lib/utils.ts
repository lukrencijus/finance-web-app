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
