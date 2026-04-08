import { signOut } from "@/auth"
import { auth } from "@/auth"
import { HeaderLogo } from "./header-logo"
import { Navigation } from "./navigation"
import { WelcomeMsg } from "./welcome-msg";
import { Loader2 } from "lucide-react";

export const Header = () => {
    return (
        <header className="bg-gray-800 text-white px-4 py-8 lg:px-14 pb-36">
            <div className="max-w-screen-2xl mx-auto">
                <div className="w-full flex items-center justify-between mb-14">
                    <div className="flex items-center lg:gap-x-16">
                        <HeaderLogo />
                        <Navigation />
                    </div>
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
                <WelcomeMsg />
            </div>
        </header>
    )
}