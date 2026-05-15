"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, CalendarDays, Settings, LayoutGrid, Wallet, RefreshCw, LogOut, Menu } from "lucide-react"
import { useState } from "react"

export function MobileBottomNav() {
    const pathname = usePathname()
    const params = useParams()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const sharedUserId = params.userId as string | undefined

    const mainRoutes = sharedUserId ? [
        { href: `/shared/${sharedUserId}`, label: "Dashboard", icon: Home },
        { href: `/shared/${sharedUserId}/monthly-sheet`, label: "Sheet", icon: CalendarDays },
        { href: "/settings", label: "Settings", icon: Settings },
    ] : [
        { href: "/", label: "Dashboard", icon: Home },
        { href: "/monthly-sheet", label: "Sheet", icon: CalendarDays },
        { href: "/settings", label: "Settings", icon: Settings },
    ]

    const menuRoutes = sharedUserId ? [
        { href: `/shared/${sharedUserId}/categories`, label: "Categories", icon: LayoutGrid },
        { href: `/shared/${sharedUserId}/capital`, label: "Capital", icon: Wallet },
        { href: `/shared/${sharedUserId}/recurring-transactions`, label: "Recurring", icon: RefreshCw },
    ] : [
        { href: "/categories", label: "Categories", icon: LayoutGrid },
        { href: "/capital", label: "Capital", icon: Wallet },
        { href: "/recurring-transactions", label: "Recurring", icon: RefreshCw },
    ]

    return (
        <>
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
                <div className="flex items-center justify-around px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    {mainRoutes.map(({ href, label, icon: Icon }) => {
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

                    {/* More Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex flex-col items-center gap-1 min-w-[64px] py-1 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <div className="p-2 rounded-xl transition-colors">
                            <Menu className="size-5" />
                        </div>
                        <span className="text-[10px] font-medium leading-none">More</span>
                    </button>
                </div>
            </nav>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-card border border-border rounded-xl shadow-lg">
                    <div className="flex flex-col px-4 py-3 gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        {menuRoutes.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                                <Icon className="size-4" />
                                <span className="text-sm font-medium">{label}</span>
                            </Link>
                        ))}
                        
                        {/* Admin link - only show if user is admin */}
                        {!sharedUserId && (
                            <Link
                                href="/admin/users"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                                <Menu className="size-4" />
                                <span className="text-sm font-medium">Admin</span>
                            </Link>
                        )}

                        {/* Logout Button */}
                        <Link
                            href="/api/auth/signout"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="size-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Overlay to close menu when clicking outside */}
            {isMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-30"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </>
    )
}