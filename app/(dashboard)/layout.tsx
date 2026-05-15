import { Header } from "@/components/header";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { getCurrentMonthSheet } from "@/lib/sheets"
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

type Props = {
    children: React.ReactNode;
};

const DashboardLayout = async ({ children }: Props) => {
    const user = await getCurrentDbUser();

    if (user.status === "PENDING") {
        redirect("/pending");
    }

    const now = new Date()
    await getCurrentMonthSheet(user.id, now.getMonth() + 1, now.getFullYear())

    return (
        <>
            <Header />
            <main className="px-3 lg:px-14 pb-24 lg:pb-0">
                {children}
            </main>
            <MobileBottomNav />
        </>
    )
}

export default DashboardLayout
