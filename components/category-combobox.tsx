"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
 * Strip diacritics and lowercase so "sviesa" matches "Šviesa" and "ISLAIDOS"
 * matches "Išlaidos" - typing Lithuanian letters on a US layout is common.
 */
function normalize(value: string): string {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
}

/**
 * Searchable replacement for the native category <select>.
 *
 * The visible text input is unnamed, so it is never submitted - it only drives
 * filtering and carries the `required` constraint so the browser still blocks
 * an empty submit. The selected id travels in a hidden input under `name`,
 * which keeps every server action's FormData shape unchanged.
 */
export function CategoryCombobox({
    categories,
    name = "categoryId",
    defaultValue = "",
    fallbackIcon = "•",
    placeholder = "Search categories...",
    emptyMessage = "No matching categories.",
    required = false,
    compact = false,
}: Props) {
    const selectedFromDefault = categories.find(c => c.id === defaultValue) ?? null

    const [selected, setSelected] = useState<ComboboxCategory | null>(selectedFromDefault)
    const [query, setQuery] = useState(selectedFromDefault?.name ?? "")
    const [isOpen, setIsOpen] = useState(false)
    const [highlight, setHighlight] = useState(0)

    const rootRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    // While the list is open the input holds the raw search text, so filter on it.
    // While closed it holds the selected name, which would filter down to one row.
    const filtered = useMemo(() => {
        if (!isOpen) return categories
        const q = normalize(query.trim())
        if (!q) return categories
        const matches = categories.filter(c => normalize(c.name).includes(q))
        // Prefix matches first - typing "ma" should surface "Maistas" above "Namai".
        return matches.sort((a, b) => {
            const aPrefix = normalize(a.name).startsWith(q) ? 0 : 1
            const bPrefix = normalize(b.name).startsWith(q) ? 0 : 1
            return aPrefix - bPrefix
        })
    }, [categories, query, isOpen])

    // Close on outside click, reverting any half-typed text to the selection.
    useEffect(() => {
        if (!isOpen) return
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            if (rootRef.current?.contains(e.target as Node)) return
            setIsOpen(false)
            setQuery(selected?.name ?? "")
        }
        document.addEventListener("mousedown", onPointerDown)
        document.addEventListener("touchstart", onPointerDown)
        return () => {
            document.removeEventListener("mousedown", onPointerDown)
            document.removeEventListener("touchstart", onPointerDown)
        }
    }, [isOpen, selected])

    // Keep the highlighted row in view when navigating with the keyboard.
    useEffect(() => {
        if (!isOpen) return
        listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" })
    }, [highlight, isOpen])

    const open = () => {
        setIsOpen(true)
        setQuery("")
        setHighlight(Math.max(0, categories.findIndex(c => c.id === selected?.id)))
    }

    const commit = (category: ComboboxCategory) => {
        setSelected(category)
        setQuery(category.name)
        setIsOpen(false)
        inputRef.current?.blur()
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault()
            if (!isOpen) { open(); return }
            if (filtered.length === 0) return
            const step = e.key === "ArrowDown" ? 1 : -1
            setHighlight(h => (h + step + filtered.length) % filtered.length)
            return
        }
        if (e.key === "Enter") {
            // Only swallow Enter while choosing; otherwise let it submit the form.
            if (!isOpen) return
            e.preventDefault()
            const pick = filtered[highlight]
            if (pick) commit(pick)
            return
        }
        if (e.key === "Escape") {
            if (!isOpen) return
            e.preventDefault()
            setIsOpen(false)
            setQuery(selected?.name ?? "")
            return
        }
        if (e.key === "Tab" && isOpen) {
            setIsOpen(false)
            setQuery(selected?.name ?? "")
        }
    }

    const padding = compact ? "px-2 py-1.5" : "px-3 py-2"

    return (
        <div ref={rootRef} className="relative">
            <input type="hidden" name={name} value={selected?.id ?? ""} />

            <div className="relative">
                {isOpen && (
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={`${name}-listbox`}
                    aria-autocomplete="list"
                    autoComplete="off"
                    required={required}
                    value={query}
                    placeholder={selected ? selected.name : placeholder}
                    onFocus={open}
                    onClick={() => { if (!isOpen) open() }}
                    onChange={e => {
                        if (!isOpen) setIsOpen(true)
                        setQuery(e.target.value)
                        setHighlight(0)
                    }}
                    onKeyDown={onKeyDown}
                    onInvalid={e => (e.target as HTMLInputElement).setCustomValidity("Please select a category")}
                    onInput={e => (e.target as HTMLInputElement).setCustomValidity("")}
                    className={`w-full border border-input bg-background text-foreground rounded-xl ${padding} ${isOpen ? "pl-8" : ""} pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                <ChevronDown
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </div>

            {isOpen && (
                <ul
                    ref={listRef}
                    id={`${name}-listbox`}
                    role="listbox"
                    className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-lg py-1"
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
                                // mousedown, not click - click fires after the input's blur.
                                onMouseDown={e => { e.preventDefault(); commit(c) }}
                                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
                                    i === highlight ? "bg-muted text-foreground" : "text-foreground"
                                }`}
                            >
                                <CategoryMarker category={c} fallbackIcon={fallbackIcon} />
                                <span className="truncate">{c.name}</span>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    )
}
