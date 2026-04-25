"use server"

import { getCurrentDbUser } from "@/lib/current-user"
import { getDashboardData } from "@/lib/sheets"

export async function fetchDashboardData() {
    const user = await getCurrentDbUser()
    return getDashboardData(user.id)
}