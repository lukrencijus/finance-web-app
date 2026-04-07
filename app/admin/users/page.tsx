import { prisma } from "@/lib/prisma";
import { getCurrentAdminUser } from "@/lib/current-user";
import { approveUser, deleteUser, makeAdmin } from "./actions";

export default async function AdminUsersPage() {
    await getCurrentAdminUser();

    const users = await prisma.user.findMany({
        orderBy: [{ createdAt: "asc" }],
    });

    return (
        <main className="p-6">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-3xl font-semibold">User Management</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Here you can view all registered users, their role and status.
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
                            {users.map((user) => (
                                <tr key={user.id} className="border-b last:border-b-0">
                                    <td className="px-4 py-3">{user.name ?? "-"}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">{user.role}</td>
                                    <td className="px-4 py-3">{user.status}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <form action={approveUser.bind(null, user.id)}>
                                                <button
                                                    type="submit"
                                                    className="rounded-md border px-3 py-1 text-xs hover:bg-muted"
                                                >
                                                    Approve
                                                </button>
                                            </form>
                                            <form action={makeAdmin.bind(null, user.id)}>
                                                <button
                                                    type="submit"
                                                    className="rounded-md border px-3 py-1 text-xs hover:bg-muted"
                                                >
                                                    Make Admin
                                                </button>
                                            </form>
                                            <form action={deleteUser.bind(null, user.id)}>
                                                <button
                                                    type="submit"
                                                    className="rounded-md border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
