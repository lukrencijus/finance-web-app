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

                {/* Mobile: centered logo only */}
                <div className="flex lg:hidden justify-center items-center py-0.5">
                    <HeaderLogo />
                </div>

                {/* Desktop: logo + nav left, actions right */}
                <div className="hidden lg:flex items-center justify-between gap-x-4">
                    <div className="flex items-center gap-x-6 min-w-0 flex-1 overflow-hidden">
                        <div className="flex-shrink-0">
                            <HeaderLogo />
                        </div>
                        <Navigation />
                    </div>
                    <div className="flex-shrink-0">
                        <HeaderUserActions isAdmin={user?.role === "ADMIN"} />
                    </div>
                </div>

            </div>
        </header>
    )
}