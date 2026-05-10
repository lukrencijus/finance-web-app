import { getCurrentDbUser } from "@/lib/current-user"
import { getSharingData } from "./actions"
import SettingsClient from "./settings-client"

export default async function SettingsPage() {
    const user = await getCurrentDbUser()
    const sharing = await getSharingData()
    
    return (
        <SettingsClient
            initialName={user.name ?? ""}
            email={user.email}
            hasPassword={!!user.password}
            isAdmin={user.role === "ADMIN"}
            sharing={sharing}
        />
    )
}