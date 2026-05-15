import Link from "next/link"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

type Props = {
    href: string
    label: string
    isActive?: boolean
}

export const NavButton = ({
    href,
    label,
    isActive,
}: Props) => {
    return (
        <Button
            asChild
            size="sm"
            variant="ghost"
            className={cn(
                "w-full lg:w-auto justify-between font-medium rounded-full border-none outline-none transition-all duration-200 px-4 h-9 whitespace-nowrap",
                
                "text-white/70 hover:text-white hover:bg-white/20",
            
                isActive && [
                    "bg-white text-blue-600",
                    "dark:bg-slate-100 dark:text-blue-950", 
                    "hover:bg-white/90 dark:hover:bg-slate-200",
                    "hover:text-blue-600 dark:hover:text-blue-950",
                    "shadow-sm active:scale-95"
                ]
            )}
        >
            <Link href={href}>
                {label}
            </Link>
        </Button>
    )
}
