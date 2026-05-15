import { signOut, auth } from "@/auth"
import { HeaderLogo } from "./header-logo"
import { Navigation } from "./navigation"
import { WelcomeMsg } from "./welcome-msg"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const Header = async () => {
    const session = await auth()
    const user = session?.user?.id
        ? await prisma.user.findUnique({ where: { id: session.user.id } })
        : null

    return (
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-950 text-white px-4 py-4 lg:px-14 lg:py-6 transition-colors duration-500 shadow-sm">
            <div className="max-w-screen-2xl mx-auto">
                <div className="w-full flex items-center justify-between mb-6 lg:mb-8">
                    <div className="flex items-center lg:gap-x-12">
                        <HeaderLogo />
                        <Navigation />
                    </div>
                    <div className="hidden lg:flex items-center gap-2">
                        {user?.role === "ADMIN" && (
                            <Link
                                href="/admin/users"
                                className="text-xs font-medium border border-white/20 rounded px-2.5 py-1 hover:bg-white/10 transition-all"
                            >
                                Admin
                            </Link>
                        )}

                        <Link
                            href="/settings"
                            className="text-xs font-medium border border-white/20 rounded px-2.5 py-1 hover:bg-white/10 transition-all"
                        >
                            {session?.user?.name}
                        </Link>

                        <form action={async () => {
                            "use server"
                            await signOut({ redirectTo: "/sign-in" })
                        }}>
                            <button type="submit"
                                className="text-xs font-medium border border-white/20 rounded px-2.5 py-1 hover:bg-white/10 transition-all">
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
                <WelcomeMsg />
            </div>
        </header>
    )
}