import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getMonthSheet } from "@/lib/sheets";
import { redirect } from "next/navigation";
import { MonthlySheetClient } from "../../monthly-sheet/monthly-sheet-client";
import { getDashboardData } from "@/lib/sheets"
import { DashboardClient } from "../../dashboard-client"

export default async function SharedDashboardPage({
    params,
}: {
    params: Promise<{ userId: string }>
}) {
    const { userId: targetUserId } = await params
    const data = await getDashboardData(targetUserId)
    return <DashboardClient data={data} />
}
