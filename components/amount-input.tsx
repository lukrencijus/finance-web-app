"use client"

import { useRef, useState } from "react"

type Props = {
    name?: string
    defaultValue?: string | number
    placeholder?: string
    required?: boolean
    /** Lets a caller grab the input node to call `.focus()` itself. Not the
        `autoFocus` attribute: to raise the keyboard on iOS, focus() has to
        run synchronously inside the same click handler that opened the
        form, which only the caller is in a position to do. */
    inputRef?: React.RefObject<HTMLInputElement | null>
    /** Tightens padding to match the inline edit form. */
    compact?: boolean
}

/**
 * Money field.
 *
 * Deliberately `type="text"` rather than `type="number"`. On a Lithuanian
 * iPhone the decimal key is a comma, which a number input silently rejects:
 * the keypress does nothing, the value resets to empty, and the caret jumps
 * around. A number input also renders its value right-aligned with spinner
 * padding on iOS, which is where the odd caret position came from.
 *
 * So: accept digits plus one separator, let the user see the comma they typed,
 * and let parseAmount() on the server turn "12,50" into 12.5. `inputMode`
 * still brings up the numeric keypad.
 */
export function AmountInput({
    name = "amount",
    defaultValue = "",
    placeholder = "0,00",
    required = false,
    inputRef,
    compact = false,
}: Props) {
    // Show a comma, matching formatCurrency everywhere else. A number coming
    // straight out of the DB stringifies with a dot.
    const [value, setValue] = useState(String(defaultValue ?? "").replace(".", ","))

    const localRef = useRef<HTMLInputElement>(null)
    const ref = inputRef ?? localRef

    const sanitize = (raw: string) => {
        // Drop anything that is not a digit or a separator.
        let cleaned = raw.replace(/[^\d.,]/g, "")
        // Keep only the first separator; "1,2,3" collapses to "1,23".
        const firstSeparator = cleaned.search(/[.,]/)
        if (firstSeparator !== -1) {
            const head = cleaned.slice(0, firstSeparator + 1)
            const tail = cleaned.slice(firstSeparator + 1).replace(/[.,]/g, "")
            cleaned = head + tail
        }
        // At most two decimals.
        const match = cleaned.match(/^(\d*)([.,]?)(\d{0,2})/)
        return match ? match[1] + match[2] + match[3] : cleaned
    }

    const padding = compact ? "px-2 py-1.5" : "px-3 py-2"

    return (
        <input
            ref={ref}
            name={name}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(sanitize(e.target.value))}
            // text-base below lg: anything under 16px makes iOS zoom the page in
            // on focus and never zoom back out.
            className={`w-full border border-input bg-background text-foreground rounded-xl ${padding} text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
        />
    )
}
