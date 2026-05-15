import { signOut, auth } from "@/auth"
import { HeaderLogo } from "./header-logo"
import { Navigation } from "./navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

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
                    
                    <div className="hidden lg:flex items-center gap-2">
                        {user?.role === "ADMIN" && (
                            <Link
                                href="/admin/users"
                                className="text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 transition-all"
                            >
                                Admin
                            </Link>
                        )}

                        <Link
                            href="/settings"
                            className="text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 transition-all"
                        >
                            Settings
                        </Link>

                        <form action={async () => {
                            "use server"
                            await signOut({ redirectTo: "/sign-in" })
                        }}>
                            <button type="submit"
                                className="text-xs font-medium bg-red-600 hover:bg-red-700 border border-red-700 rounded-full px-4 py-1.5 transition-all">
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    )
}