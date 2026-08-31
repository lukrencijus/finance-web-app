"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Search } from "lucide-react"

type ComboboxCategory = {
    id: string
    name: string
    /** Transaction categories carry an emoji. */
    icon?: string | null
    /** Capital categories carry a hex colour instead, shown as a dot. */
    color?: string | null
}

type Props = {
    categories: ComboboxCategory[]
    /** Form field name carrying the selected id. Defaults to "categoryId". */
    name?: string
    defaultValue?: string
    /** Shown in place of a missing category icon. Ignored when a colour is set. */
    fallbackIcon?: string
    placeholder?: string
    emptyMessage?: string
    required?: boolean
    /** Tightens padding to match the inline edit form. */
    compact?: boolean
}

/**
 * Strip diacritics and lowercase so "sviesa" matches "Šviesa" and "ISLAIDOS"
 * matches "Išlaidos" - typing Lithuanian letters on a US layout is common.
 */
function normalize(value: string): string {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
}

/** Colour dot for capital categories, emoji for transaction categories. */
function CategoryMarker({ category, fallbackIcon }: { category: ComboboxCategory; fallbackIcon: string }) {
    if (category.color) {
        return (
            <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
            />
        )
    }
    return <span className="shrink-0">{category.icon || fallbackIcon}</span>
}

/**
 * Searchable replacement for the native category <select>.
 *
 * The trigger is an input rather than a button so that `required` still blocks
 * an empty submit - it has no `name`, so it is never submitted. The selected id
 * travels in a hidden input under `name`, keeping every server action's
 * FormData shape unchanged.
 *
 * Search is opt-in, not automatic: opening the list shows every category and,
 * on touch devices, deliberately does not focus anything. Raising the keyboard
 * on open would cover the very list the user wants to scroll. Typing is one
 * extra tap away, on the search row.
 */
export function CategoryCombobox({
    categories,
    name = "categoryId",
    defaultValue = "",
    fallbackIcon = "•",
    placeholder = "Select a category...",
    emptyMessage = "No matching categories.",
    required = false,
    compact = false,
}: Props) {
    const selectedFromDefault = categories.find(c => c.id === defaultValue) ?? null

    const [selected, setSelected] = useState<ComboboxCategory | null>(selectedFromDefault)
    const [query, setQuery] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    // Decided at open time: below lg the list renders as a bottom sheet,
    // because an absolute dropdown inside the (scrollable) form sheet is
    // clipped and nearly impossible to scroll on touch screens.
    const [isMobile, setIsMobile] = useState(false)
    const [highlight, setHighlight] = useState(0)

    const rootRef = useRef<HTMLDivElement>(null)
    // The mobile sheet lives in a portal, outside rootRef's subtree.
    const sheetRef = useRef<HTMLDivElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLInputElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const filtered = useMemo(() => {
        const q = normalize(query.trim())
        if (!q) return categories
        const matches = categories.filter(c => normalize(c.name).includes(q))
        // Prefix matches first - typing "ma" should surface "Maistas" above "Namai".
        return matches.sort((a, b) => {
            const aPrefix = normalize(a.name).startsWith(q) ? 0 : 1
            const bPrefix = normalize(b.name).startsWith(q) ? 0 : 1
            return aPrefix - bPrefix
        })
    }, [categories, query])

    useEffect(() => {
        if (!isOpen) return
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const t = e.target as Node
            if (rootRef.current?.contains(t) || sheetRef.current?.contains(t)) return
            // The mobile backdrop closes via its own onClick. Closing here on
            // touchstart would unmount it before the tap's click fires, and
            // the click would fall through onto the add-transaction sheet's
            // backdrop underneath, closing the whole form too.
            if (backdropRef.current?.contains(t)) return
            setIsOpen(false)
            setQuery("")
        }
        document.addEventListener("mousedown", onPointerDown)
        document.addEventListener("touchstart", onPointerDown)
        return () => {
            document.removeEventListener("mousedown", onPointerDown)
            document.removeEventListener("touchstart", onPointerDown)
        }
    }, [isOpen])

    // Keep the highlighted row in view when navigating with the keyboard.
    useEffect(() => {
        if (!isOpen) return
        listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" })
    }, [highlight, isOpen])

    const open = () => {
        setIsOpen(true)
        setQuery("")
        // Match the app-wide lg breakpoint used for the desktop/mobile split.
        setIsMobile(typeof window !== "undefined"
            && window.matchMedia("(max-width: 1023px)").matches)
        setHighlight(Math.max(0, categories.findIndex(c => c.id === selected?.id)))
        // Mouse users expect to start typing straight away; touch users would
        // just get a keyboard covering the list they wanted to scroll.
        const isTouch = typeof window !== "undefined"
            && window.matchMedia("(pointer: coarse)").matches
        if (!isTouch) requestAnimationFrame(() => searchRef.current?.focus())
    }

    const close = () => {
        setIsOpen(false)
        setQuery("")
    }

    const commit = (category: ComboboxCategory) => {
        setSelected(category)
        // React drives the trigger's value, so no `input` event ever fires and
        // the custom validity set by onInvalid would otherwise stick forever,
        // keeping the field invalid even after a category is picked.
        triggerRef.current?.setCustomValidity("")
        close()
    }

    const onListKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault()
            if (filtered.length === 0) return
            const step = e.key === "ArrowDown" ? 1 : -1
            setHighlight(h => (h + step + filtered.length) % filtered.length)
            return
        }
        if (e.key === "Enter") {
            e.preventDefault()
            const pick = filtered[highlight]
            if (pick) commit(pick)
            return
        }
        if (e.key === "Escape" || e.key === "Tab") {
            close()
        }
    }

    const padding = compact ? "px-2 py-1.5" : "px-3 py-2"

    // Shared between the desktop dropdown and the mobile bottom sheet - only
    // one of them is mounted at a time, so the refs stay unambiguous.
    const searchRow = (
        <div className="relative border-b border-border">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
                ref={searchRef}
                type="text"
                autoComplete="off"
                value={query}
                placeholder="Search..."
                onChange={e => { setQuery(e.target.value); setHighlight(0) }}
                onKeyDown={onListKeyDown}
                className="w-full bg-transparent text-foreground pl-8 pr-3 py-2 text-base lg:text-sm focus:outline-none"
            />
        </div>
    )

    const renderList = (heightClasses: string) => (
        <ul
            ref={listRef}
            id={`${name}-listbox`}
            role="listbox"
            className={`${heightClasses} overflow-y-auto py-1 overscroll-contain`}
        >
            {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                    {categories.length === 0 ? emptyMessage : "No matching categories."}
                </li>
            ) : (
                filtered.map((c, i) => (
                    <li
                        key={c.id}
                        role="option"
                        aria-selected={c.id === selected?.id}
                        onMouseEnter={() => setHighlight(i)}
                        // mousedown, not click - click fires after blur.
                        onMouseDown={e => { e.preventDefault(); commit(c) }}
                        className={`flex items-center gap-2 px-3 py-2.5 lg:py-2 text-base lg:text-sm cursor-pointer ${
                            i === highlight ? "bg-muted text-foreground" : "text-foreground"
                        }`}
                    >
                        <CategoryMarker category={c} fallbackIcon={fallbackIcon} />
                        <span className="truncate">{c.name}</span>
                    </li>
                ))
            )}
        </ul>
    )

    return (
        <div ref={rootRef} className="relative">
            <input type="hidden" name={name} value={selected?.id ?? ""} />

            <div className="relative">
                <input
                    ref={triggerRef}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={`${name}-listbox`}
                    autoComplete="off"
                    required={required}
                    // Read-only in practice: typing happens in the search row.
                    // Not the `readOnly` attribute though, which would exempt
                    // this field from constraint validation and lose `required`.
                    onKeyDown={e => {
                        if (e.key === "Tab") return
                        e.preventDefault()
                        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                            if (!isOpen) open()
                        }
                    }}
                    // Suppress focus on tap so mobile keyboards stay down, and
                    // tell the OS not to raise one even if focus arrives via
                    // form validation.
                    inputMode="none"
                    onMouseDown={e => {
                        e.preventDefault()
                        if (isOpen) close()
                        else open()
                    }}
                    value={selected?.name ?? ""}
                    placeholder={placeholder}
                    onChange={() => { /* value is driven by selection only */ }}
                    onInvalid={e => (e.target as HTMLInputElement).setCustomValidity("Please select a category")}
                    onInput={e => (e.target as HTMLInputElement).setCustomValidity("")}
                    className={`w-full border border-input bg-background text-foreground rounded-xl ${padding} pr-8 text-base lg:text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                <ChevronDown
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </div>

            {isOpen && !isMobile && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {searchRow}
                    {renderList("max-h-56")}
                </div>
            )}

            {isOpen && isMobile && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[120] flex flex-col justify-end">
                    <div
                        ref={backdropRef}
                        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                        onClick={close}
                    />
                    <div
                        ref={sheetRef}
                        className="relative bg-card border-t border-border rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] flex flex-col max-h-[70%] animate-in slide-in-from-bottom duration-200"
                    >
                        <div className="pt-3 pb-1 flex justify-center shrink-0">
                            <div className="h-1 w-10 rounded-full bg-border" />
                        </div>
                        <div className="shrink-0">{searchRow}</div>
                        {renderList("flex-1 min-h-0")}
                        <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
