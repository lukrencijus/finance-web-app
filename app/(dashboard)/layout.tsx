import { Header } from "@/components/header";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { getCurrentMonthSheet } from "@/lib/sheets"

type Props = {
    children: React.ReactNode;
};

const DashboardLayout = async ({ children }: Props) => {
    const user = await getCurrentDbUser();

    if (user.status === "PENDING") {
        redirect("/pending");
    }

    await getCurrentMonthSheet(user.id)

    return (
        <>
            <Header />
            <main className="px-3 lg:px-14">
                {children}
            </main>
        </>
    );
};

export default DashboardLayout;
