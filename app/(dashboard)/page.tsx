import { getCurrentDbUser } from "@/lib/current-user"
import { getDashboardData } from "@/lib/sheets"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
    const user = await getCurrentDbUser()
    const data = await getDashboardData(user.id)
    return <DashboardClient data={data} userName={user.name ?? "there"} />
}