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
        <header className="bg-gray-800 text-white px-4 py-8 lg:px-14 pb-36">
            <div className="max-w-screen-2xl mx-auto">
                <div className="w-full flex items-center justify-between mb-14">
                    <div className="flex items-center lg:gap-x-16">
                        <HeaderLogo />
                        <Navigation />
                    </div>
                    <div className="flex items-center gap-3">
                        {user?.role === "ADMIN" && (
                            <Link
                                href="/admin/users"
                                className="text-sm border border-white/30 rounded-md px-3 py-1 hover:bg-white/10 transition-colors"
                            >
                                Admin
                            </Link>
                        )}
                        <form action={async () => {
                            "use server"
                            await signOut({ redirectTo: "/sign-in" })
                        }}>
                            <button type="submit"
                                className="text-sm border rounded-md px-3 py-1">
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