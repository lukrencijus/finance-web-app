"use client"

import { useMedia } from "react-use"
import { Menu } from "lucide-react"
import { useState } from "react"
import { usePathname, useRouter, useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { NavButton } from "./nav-button"

import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet"

export const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false)

    const router = useRouter()
    const pathname = usePathname()
    const isMobile = useMedia("(max-width: 1024px)", false)

    const params = useParams()
    
    // params.userId will be defined if we are inside the /shared/[userId] folder
    // It will be undefined if we are on our own dashboard
    const sharedUserId = params.userId as string | undefined

    const routes = sharedUserId ? [
        { href: `/shared/${sharedUserId}`, label: "Dashboard" },
        { href: `/shared/${sharedUserId}/monthly-sheet`, label: "Monthly Sheet" },
        { href: `/shared/${sharedUserId}/recurring-transactions`, label: "Recurring Transactions" },
        { href: `/shared/${sharedUserId}/categories`, label: "Transaction Categories" },
        { href: `/shared/${sharedUserId}/capital`, label: "Capital Categories" },
    ] : [
        { href: "/", label: "Dashboard" },
        { href: "/monthly-sheet", label: "Monthly Sheet" },
        { href: "/recurring-transactions", label: "Recurring Transactions" },
        { href: "/categories", label: "Transaction Categories" },
        { href: "/capital", label: "Capital Categories" },
    ]

    const onClick = (href: string) => {
        router.push(href)
        setIsOpen(false)
    }

    if (isMobile) {
        return null // MobileBottomNav handles mobile navigation
    }

    return (
        <nav className="hidden lg:flex items-center gap-x-1 flex-wrap">
            {routes.map((route) => (
                <NavButton
                    key={route.href}
                    href={route.href}
                    label={route.label}
                    isActive={pathname === route.href}
                />
            ))}
        </nav>
    )
}