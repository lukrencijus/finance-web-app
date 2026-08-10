"use client"

import type { ReactNode } from "react"
import { useLinkStatus } from "next/link"
import { Loader2 } from "lucide-react"

/**
 * Swaps its children for a spinner while the surrounding <Link> is navigating.
 *
 * `useLinkStatus` only reports on the Link it is rendered inside, so this must
 * be a child of that Link.
 *
 * The children stay in the layout as invisible placeholders rather than being
 * unmounted, so the control keeps its exact size while loading - a nav button
 * that grows or shrinks mid-tap reads as a glitch. The spinner is centred over
 * whatever it replaced.
 *
 * `loading.tsx` covers the destination page; this covers the gap between the
 * tap and that skeleton appearing, on the control the user actually touched.
 */
export function LinkPendingIndicator({
    children,
    spinnerClassName = "size-6",
}: {
    children: ReactNode
    spinnerClassName?: string
}) {
    const { pending } = useLinkStatus()

    return (
        <span className="relative inline-flex items-center justify-center">
            <span className={pending ? "invisible" : undefined}>{children}</span>
            {pending && (
                <Loader2
                    aria-hidden
                    className={`absolute animate-spin ${spinnerClassName}`}
                />
            )}
        </span>
    )
}
