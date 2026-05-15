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
        <header className="bg-blue-600 dark:bg-blue-900 text-white px-4 py-8 lg:px-14 pb-36 transition-colors duration-500">
            <div className="max-w-screen-2xl mx-auto">
                <div className="w-full flex items-center justify-between mb-14">
                    <div className="flex items-center lg:gap-x-16">
                        <HeaderLogo />
                        <Navigation />
                    </div>
                    <div className="hidden lg:flex items-center gap-3">
                        {user?.role === "ADMIN" && (
                            <Link
                                href="/admin/users"
                                className="text-sm font-medium border border-white/20 rounded-md px-3 py-1.5 hover:bg-white/10 transition-all"
                            >
                                Admin
                            </Link>
                        )}

                        <Link
                            href="/settings"
                            className="text-sm font-medium border border-white/20 rounded-md px-3 py-1.5 hover:bg-white/10 transition-all flex items-center gap-x-2"
                        >
                            {session?.user?.name}
                        </Link>

                        <form action={async () => {
                            "use server"
                            await signOut({ redirectTo: "/sign-in" })
                        }}>
                            <button type="submit"
                                className="text-sm font-medium border border-white/20 rounded-md px-3 py-1.5 hover:bg-white/10 transition-all flex items-center gap-x-2">
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