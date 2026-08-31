"use client"

import { useEffect } from "react"

// One shared counter so stacked overlays (e.g. the category picker opened on
// top of the add-transaction sheet) don't fight over the body styles - the
// page unlocks only when the last overlay closes.
let lockCount = 0
let savedScrollY = 0

function lock() {
    if (++lockCount > 1) return
    savedScrollY = window.scrollY
    const body = document.body
    body.style.position = "fixed"
    body.style.top = `-${savedScrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    body.style.overflow = "hidden"
}

function unlock() {
    if (--lockCount > 0) return
    const body = document.body
    body.style.position = ""
    body.style.top = ""
    body.style.left = ""
    body.style.right = ""
    body.style.width = ""
    body.style.overflow = ""
    window.scrollTo(0, savedScrollY)
}

/**
 * Stops the page behind an open overlay from scrolling along with it.
 *
 * Uses position: fixed rather than overflow: hidden because iOS Safari
 * ignores the latter on <body>. Only engages below the lg breakpoint - on
 * desktop these forms render inline (or as small popovers), where locking
 * the page would be wrong.
 */
export function useBodyScrollLock(active: boolean) {
    useEffect(() => {
        if (!active) return
        if (!window.matchMedia("(max-width: 1023px)").matches) return
        lock()
        return unlock
    }, [active])
}
