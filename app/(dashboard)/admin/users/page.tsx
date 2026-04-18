import { prisma } from "@/lib/prisma"
import { getCurrentAdminUser } from "@/lib/current-user"
import { AdminUsersClient } from "./users-client"

export default async function AdminUsersPage() {
    const currentUser = await getCurrentAdminUser()
    const users = await prisma.user.findMany({
        orderBy: [
            { role: "asc" },
            { createdAt: "asc" } 
        ],
    })

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-3xl font-semibold">User Management</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    All users: {users.length}
                </p>
                <AdminUsersClient
                    users={users}
                    currentUserId={currentUser.id}
                />
            </div>
        </main>
    )
}
