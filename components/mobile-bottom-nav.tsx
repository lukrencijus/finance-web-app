"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, CalendarDays, Settings, LayoutGrid, Wallet, RefreshCw, LogOut, Menu, X, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
    const pathname = usePathname()
    const params = useParams()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const sharedUserId = params.userId as string | undefined

    useEffect(() => {
        setIsMenuOpen(false)
    }, [pathname])

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

    const isInsideMenu = menuRoutes.some(route => pathname === route.href) || pathname === "/admin/users";

    return (
        <>
            {/* Floating Navigation */}
            <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px]">
                <nav className="relative bg-card/70 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-[2.5rem] p-2">
                    <div className="flex items-center justify-between relative z-10">
                        {mainRoutes.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href && !isMenuOpen
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-label={label}
                                    className={cn(
                                        "relative flex-1 flex items-center justify-center h-14 rounded-full transition-all duration-300",
                                        isActive 
                                            ? "text-primary bg-primary/10" 
                                            : "text-muted-foreground active:scale-90"
                                    )}
                                >
                                    <Icon className={cn("size-6 transition-transform", isActive && "stroke-[2.5px] scale-110")} />
                                </Link>
                            )
                        })}

                        {/* More Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="More"
                            className={cn(
                                "relative flex-1 flex items-center justify-center h-14 rounded-full transition-all duration-300",
                                (isMenuOpen || isInsideMenu) 
                                    ? "text-primary bg-primary/10" 
                                    : "text-muted-foreground active:scale-90"
                            )}
                        >
                            {isMenuOpen ? (
                                <X className="size-6 scale-110" />
                            ) : (
                                <Menu className={cn("size-6 transition-transform", isInsideMenu && "stroke-[2.5px] scale-110")} />
                            )}
                            {isInsideMenu && !isMenuOpen && (
                                <span className="absolute bottom-2 size-1 bg-primary rounded-full" />
                            )}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Dropdown */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-x-0 bottom-32 z-50 flex flex-col items-center px-6">
                    <div className="w-full max-w-[300px] bg-card/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="flex flex-col gap-1">
                            {menuRoutes.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] hover:bg-primary/10 active:bg-primary/20 transition-all group"
                                >
                                    <div className="flex items-center justify-center size-10 bg-primary/5 rounded-2xl group-hover:bg-primary/20 transition-colors">
                                        <Icon className="size-5 text-primary" />
                                    </div>
                                    <span className="text-sm font-semibold tracking-tight">{label}</span>
                                </Link>
                            ))}
                            
                            <div className="h-px bg-white/5 my-2 mx-4" />

                            {!sharedUserId && (
                                <Link href="/admin/users" className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] hover:bg-primary/10 transition-colors">
                                    <div className="flex items-center justify-center size-10 bg-primary/5 rounded-2xl">
                                        <Shield className="size-5 text-primary" />
                                    </div>
                                    <span className="text-sm font-semibold tracking-tight">Admin</span>
                                </Link>
                            )}

                            <Link href="/api/auth/signout" className="flex items-center gap-4 px-4 py-4 rounded-[1.5rem] hover:bg-red-500/10 transition-colors text-red-500">
                                <div className="flex items-center justify-center size-10 bg-red-500/5 rounded-2xl">
                                    <LogOut className="size-5" />
                                </div>
                                <span className="text-sm font-semibold tracking-tight">Logout</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Overlay */}
            {isMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px] animate-in fade-in duration-500"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </>
    )
}
