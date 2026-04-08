import { prisma } from "@/lib/prisma"
import { getCurrentAdminUser } from "@/lib/current-user"
import { approveUser, revokeUser, makeAdmin, revokeAdmin, deleteUser } from "./actions"
import Link from "next/link"

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
                <div className="mt-6 overflow-hidden rounded-xl border bg-background">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const isSelf = user.id === currentUser.id
                                const isActive = user.status === "ACTIVE"
                                const isAdmin = user.role === "ADMIN"

                                return (
                                    <tr key={user.id} className="border-b last:border-b-0">
                                        <td className="px-4 py-3">
                                            {user.name ?? "-"}
                                            {isSelf && (
                                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                                isAdmin
                                                    ? "border-blue-300 text-blue-700 bg-blue-50"
                                                    : "border-gray-300 text-gray-600 bg-gray-50"
                                            }`}>
                                                {isAdmin ? "Admin" : "User"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                                isActive
                                                    ? "border-green-300 text-green-700 bg-green-50"
                                                    : "border-yellow-300 text-yellow-700 bg-yellow-50"
                                            }`}>
                                                {isActive ? "Active" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isSelf ? (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {!isActive && (
                                                        <form action={approveUser.bind(null, user.id)}>
                                                            <button type="submit"
                                                                className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50">
                                                                Approve
                                                            </button>
                                                        </form>
                                                    )}
                                                    {isActive && !isAdmin && (
                                                        <form action={revokeUser.bind(null, user.id)}>
                                                            <button type="submit"
                                                                className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
                                                                Revoke
                                                            </button>
                                                        </form>
                                                    )}
                                                    {!isAdmin && (
                                                        <form action={makeAdmin.bind(null, user.id)}>
                                                            <button type="submit"
                                                                className="rounded-md border border-blue-300 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50">
                                                                Admin
                                                            </button>
                                                        </form>
                                                    )}
                                                    {isAdmin && (
                                                        <form action={revokeAdmin.bind(null, user.id)}>
                                                            <button type="submit"
                                                                className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
                                                                Revoke Admin
                                                            </button>
                                                        </form>
                                                    )}
                                                    <form action={deleteUser.bind(null, user.id)}>
                                                        <button type="submit"
                                                            className="rounded-md border border-destructive px-3 py-1 text-xs text-destructive hover:bg-muted">
                                                            Delete
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}