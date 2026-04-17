import { getCurrentDbUser } from "@/lib/current-user"
import SettingsClient from "./settings-client"

export default async function SettingsPage() {
    const user = await getCurrentDbUser()
    return (
        <SettingsClient
            initialName={user.name ?? ""}
            email={user.email}
            hasPassword={!!user.password}
            isAdmin={user.role === "ADMIN"}
        />
    )
}