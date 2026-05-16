import { auth } from "@/auth"
import { HeaderLogo } from "./header-logo"
import { Navigation } from "./navigation"
import { prisma } from "@/lib/prisma"
import { HeaderUserActions } from "./header-user-actions"

export const Header = async () => {
    const session = await auth()
    const user = session?.user?.id
        ? await prisma.user.findUnique({ where: { id: session.user.id } })
        : null

    return (
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950 text-white px-4 py-2.5 lg:px-14 transition-colors duration-500 shadow-sm">
            <div className="max-w-screen-2xl mx-auto">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center lg:gap-x-8">
                        <HeaderLogo />
                        <Navigation />
                    </div>
                    
                    <HeaderUserActions isAdmin={user?.role === "ADMIN"} />
                </div>
            </div>
        </header>
    )
}
