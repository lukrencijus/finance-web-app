"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, CalendarDays, RefreshCw, Settings } from "lucide-react"

const routes = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/monthly-sheet", label: "Sheet", icon: CalendarDays },
    { href: "/recurring-transactions", label: "Recurring", icon: RefreshCw },
    { href: "/settings", label: "Settings", icon: Settings },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const params = useParams()

    // Shared pages have their own bottom bar
    if (params.userId) return null

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
            <div className="flex items-center justify-around px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {routes.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-1 min-w-[64px] py-1 transition-colors
                                ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                                <Icon className="size-5" />
                            </div>
                            <span className="text-[10px] font-medium leading-none">{label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}