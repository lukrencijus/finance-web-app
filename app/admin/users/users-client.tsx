"use client"
import { useState } from "react"

type User = {
    id: string
    name: string | null
    email: string
    role: string
    status: string
    password: string | null
}

type Actions = {
    approveUser: (id: string) => Promise<void>
    revokeUser: (id: string) => Promise<void>
    makeAdmin: (id: string) => Promise<void>
    revokeAdmin: (id: string) => Promise<void>
    deleteUser: (id: string) => Promise<void>
    adminUpdateName: (id: string, formData: FormData) => Promise<void>
    adminResetPassword: (id: string, formData: FormData) => Promise<{ error: string } | { success: boolean }>
}

type Props = {
    users: User[]
    currentUserId: string
    actions: Actions
}

export function AdminUsersClient({ users, currentUserId, actions }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [resetMsg, setResetMsg] = useState<Record<string, string>>({})

    async function handleResetPassword(userId: string, formData: FormData) {
        const result = await actions.adminResetPassword(userId, formData)
        if (result && "error" in result) {
            setResetMsg((prev) => ({ ...prev, [userId]: result.error }))
        } else {
            setResetMsg((prev) => ({ ...prev, [userId]: "Password updated." }))
        }
    }

    return (
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
                        const isSelf = user.id === currentUserId
                        const isActive = user.status === "ACTIVE"
                        const isAdmin = user.role === "ADMIN"
                        const isExpanded = expandedId === user.id

                        return (
                            <>
                                <tr key={user.id} className="border-b">
                                    <td className="px-4 py-3">
                                        {user.name ?? "-"}
                                        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
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
                                                    <form action={actions.approveUser.bind(null, user.id)}>
                                                        <button type="submit" className="rounded-md border border-green-300 px-3 py-1 text-xs text-green-700 hover:bg-green-50">
                                                            Approve
                                                        </button>
                                                    </form>
                                                )}
                                                {isActive && !isAdmin && (
                                                    <form action={actions.revokeUser.bind(null, user.id)}>
                                                        <button type="submit" className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
                                                            Revoke
                                                        </button>
                                                    </form>
                                                )}
                                                {!isAdmin && (
                                                    <form action={actions.makeAdmin.bind(null, user.id)}>
                                                        <button type="submit" className="rounded-md border border-blue-300 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50">
                                                            Admin
                                                        </button>
                                                    </form>
                                                )}
                                                {isAdmin && (
                                                    <form action={actions.revokeAdmin.bind(null, user.id)}>
                                                        <button type="submit" className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
                                                            Revoke Admin
                                                        </button>
                                                    </form>
                                                )}
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : user.id)}
                                                    className={`rounded-md border px-3 py-1 text-xs hover:bg-muted ${isExpanded ? "bg-muted" : ""}`}
                                                >
                                                    {isExpanded ? "Close" : "Edit"}
                                                </button>
                                                <form action={actions.deleteUser.bind(null, user.id)}>
                                                    <button type="submit" className="rounded-md border border-destructive px-3 py-1 text-xs text-destructive hover:bg-muted">
                                                        Delete
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </td>
                                </tr>

                                {/* Expanded edit row */}
                                {isExpanded && (
                                    <tr key={`${user.id}-edit`} className="border-b bg-muted/20">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="flex flex-wrap gap-8">

                                                {/* Name */}
                                                <form
                                                    action={(formData) => actions.adminUpdateName(user.id, formData)}
                                                    className="flex items-end gap-2"
                                                >
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                                                        <input
                                                            name="name"
                                                            defaultValue={user.name ?? ""}
                                                            placeholder="Display name"
                                                            className="border rounded-md px-3 py-1.5 text-sm bg-background w-48"
                                                        />
                                                    </div>
                                                    <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs hover:opacity-90">
                                                        Save
                                                    </button>
                                                </form>

                                                {/* Password reset */}
                                                {user.password ? (
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault()
                                                            handleResetPassword(user.id, new FormData(e.currentTarget))
                                                        }}
                                                        className="flex items-end gap-2"
                                                    >
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground">New password</label>
                                                            <input
                                                                name="password"
                                                                type="password"
                                                                placeholder="Min. 8 characters"
                                                                className="border rounded-md px-3 py-1.5 text-sm bg-background w-48"
                                                            />
                                                        </div>
                                                        <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs hover:opacity-90">
                                                            Reset
                                                        </button>
                                                    </form>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground self-center">Google user — no password</p>
                                                )}

                                                {resetMsg[user.id] && (
                                                    <p className={`text-xs self-center ${resetMsg[user.id].includes("updated") ? "text-green-600" : "text-destructive"}`}>
                                                        {resetMsg[user.id]}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}