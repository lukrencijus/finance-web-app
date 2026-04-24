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
            variant="outline"
            className={cn(
                "w-full lg:w-auto justify-between font-medium border border-white/20 focus-visible:ring-offset-0 focus-visible:ring-transparent outline-none transition-all duration-200",
                
                "text-white/80 hover:text-white",
                
                "hover:bg-white/20",
                
                isActive ? "bg-white/10 text-white font-semibold" : "bg-transparent",
                
                "focus:bg-white/30"
            )}>
            <Link href={href}>
                {label}
            </Link>
        </Button>
    )
}
