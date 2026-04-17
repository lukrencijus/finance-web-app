import { prisma } from "@/lib/prisma"
import { getCurrentAdminUser } from "@/lib/current-user"
import { approveUser, revokeUser, makeAdmin, revokeAdmin, deleteUser, adminUpdateName, adminResetPassword } from "./actions"
import Link from "next/link"
import { AdminUsersClient } from "./users-client"

export default async function AdminUsersPage() {
    const currentUser = await getCurrentAdminUser()
    const users = await prisma.user.findMany({
        orderBy: [{ createdAt: "asc" }],
    })

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                    ← Return to main
                </Link>
                <h1 className="text-3xl font-semibold">User Management</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    All users: {users.length}
                </p>
                <AdminUsersClient
                    users={users}
                    currentUserId={currentUser.id}
                    actions={{ approveUser, revokeUser, makeAdmin, revokeAdmin, deleteUser, adminUpdateName, adminResetPassword }}
                />
            </div>
        </main>
    )
}