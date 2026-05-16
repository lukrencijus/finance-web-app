"use client"

import { useState } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { AlertCircle, LogOut } from "lucide-react"

interface HeaderUserActionsProps {
    isAdmin: boolean
}

export function HeaderUserActions({ isAdmin }: HeaderUserActionsProps) {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    return (
        <>
            <div className="hidden lg:flex items-center gap-2">
                {isAdmin && (
                    <Link
                        href="/admin/users"
                        className="text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-1.5 transition-all"
                    >
                        Admin
                    </Link>
                )}

                <Link
                    href="/settings"
                    className="text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-1.5 transition-all"
                >
                    Settings
                </Link>

                <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    className="text-xs font-medium bg-red-600 hover:bg-red-700 border border-red-700 rounded-xl px-4 py-1.5 transition-all"
                >
                    Sign Out
                </button>
            </div>

            {/* Logout Warning Dialog */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowLogoutConfirm(false)}
                    />
                    
                    {/* Dialog Content */}
                    <div className="relative w-full max-w-[320px] bg-card/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center">
                                <AlertCircle className="size-10 text-red-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-foreground">Sign Out?</h3>
                        <p className="text-sm text-muted-foreground mb-8">
                            Are you sure you want to log out?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => signOut({ callbackUrl: "/sign-in" })}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl active:scale-95 transition-all"
                            >
                                Sign Out
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full py-4 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-2xl active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
