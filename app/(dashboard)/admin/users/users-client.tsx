"use client"
import { useState, Fragment } from "react"
import { 
    approveUser, 
    revokeUser, 
    makeAdmin, 
    revokeAdmin, 
    deleteUser, 
    adminUpdateName, 
    adminResetPassword 
} from "./actions"

type User = {
    id: string
    name: string | null
    email: string
    role: string
    status: string
    password: string | null
}

type Props = {
    users: User[]
    currentUserId: string
}

export function AdminUsersClient({ users, currentUserId }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [resetMsg, setResetMsg] = useState<Record<string, string>>({})

    async function handleResetPassword(userId: string, formData: FormData) {
        const result = await adminResetPassword(userId, formData)
        if (result && "error" in result) {
            setResetMsg((prev) => ({ ...prev, [userId]: result.error || "An unknown error occurred" }))
        } else {
            setResetMsg((prev) => ({ ...prev, [userId]: "Password updated." }))
        }
    }

    return (
        <div className="mt-6">
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-background">
                <table className="w-full text-left text-sm text-foreground">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <UserRow 
                                key={user.id} 
                                user={user} 
                                currentUserId={currentUserId}
                                isExpanded={expandedId === user.id}
                                setExpandedId={setExpandedId}
                                resetMsg={resetMsg}
                                handleResetPassword={handleResetPassword}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Hidden on desktop) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {users.map((user) => (
                    <UserCard 
                        key={user.id} 
                        user={user} 
                        currentUserId={currentUserId}
                        isExpanded={expandedId === user.id}
                        setExpandedId={setExpandedId}
                        resetMsg={resetMsg}
                        handleResetPassword={handleResetPassword}
                    />
                ))}
            </div>
        </div>
    )
}

// SHARED ACTION BUTTONS COMPONENT
function ActionButtons({ user, currentUserId, isExpanded, setExpandedId }: { 
    user: User, 
    currentUserId: string, 
    isExpanded: boolean, 
    setExpandedId: (id: string | null) => void 
}) {
    const isSelf = user.id === currentUserId
    const isActive = user.status === "ACTIVE"
    const isAdmin = user.role === "ADMIN"

    if (isSelf) return <span className="text-xs text-muted-foreground italic">You (No actions)</span>

    return (
        <div className="flex flex-wrap gap-2">
            {!isActive && (
                <form action={approveUser.bind(null, user.id)}>
                    <button type="submit" className="rounded-md border border-green-500/30 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-500/10">
                        Approve
                    </button>
                </form>
            )}
            {isActive && !isAdmin && (
                <form action={revokeUser.bind(null, user.id)}>
                    <button type="submit" className="rounded-md border border-yellow-500/30 px-3 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10">
                        Revoke
                    </button>
                </form>
            )}
            {!isAdmin && isActive && (
                <form action={makeAdmin.bind(null, user.id)}>
                    <button type="submit" className="rounded-md border border-blue-500/30 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                        Make Admin
                    </button>
                </form>
            )}
            {isAdmin && (
                <form action={revokeAdmin.bind(null, user.id)}>
                    <button type="submit" className="rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10">
                        Revoke Admin
                    </button>
                </form>
            )}
            <button
                onClick={() => setExpandedId(isExpanded ? null : user.id)}
                className={`rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-muted ${isExpanded ? "bg-muted" : ""}`}
            >
                {isExpanded ? "Close" : "Edit"}
            </button>
            <form 
                action={deleteUser.bind(null, user.id)}
                onSubmit={(e) => !window.confirm(`Delete ${user.email}?`) && e.preventDefault()}
            >
                <button type="submit" className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10">
                    Delete
                </button>
            </form>
        </div>
    )
}

// DESKTOP ROW COMPONENT
function UserRow({ user, currentUserId, isExpanded, setExpandedId, resetMsg, handleResetPassword }: any) {
    const isSelf = user.id === currentUserId
    const isAdmin = user.role === "ADMIN"
    const isActive = user.status === "ACTIVE"

    return (
        <Fragment>
            <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{user.name ?? "-"}</span>
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                    <Badge variant={isAdmin ? "blue" : "muted"}>{isAdmin ? "Admin" : "User"}</Badge>
                </td>
                <td className="px-4 py-3">
                    <Badge variant={isActive ? "green" : "yellow"}>{isActive ? "Active" : "Pending"}</Badge>
                </td>
                <td className="px-4 py-3">
                    <ActionButtons user={user} currentUserId={currentUserId} isExpanded={isExpanded} setExpandedId={setExpandedId} />
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-muted/20">
                    <td colSpan={5} className="px-6 py-4 border-b border-border">
                        <EditSection user={user} resetMsg={resetMsg} handleResetPassword={handleResetPassword} />
                    </td>
                </tr>
            )}
        </Fragment>
    )
}

// MOBILE CARD COMPONENT
function UserCard({ user, currentUserId, isExpanded, setExpandedId, resetMsg, handleResetPassword }: any) {
    const isSelf = user.id === currentUserId
    const isAdmin = user.role === "ADMIN"
    const isActive = user.status === "ACTIVE"

    return (
        <div className="rounded-xl border border-border bg-background p-4 space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-foreground">{user.name ?? "No Name"} {isSelf && "(You)"}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge variant={isAdmin ? "blue" : "muted"}>{isAdmin ? "Admin" : "User"}</Badge>
                    <Badge variant={isActive ? "green" : "yellow"}>{isActive ? "Active" : "Pending"}</Badge>
                </div>
            </div>
            
            <div className="pt-2 border-t border-border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Actions</p>
                <ActionButtons user={user} currentUserId={currentUserId} isExpanded={isExpanded} setExpandedId={setExpandedId} />
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border bg-muted/20 -mx-4 px-4 pb-4 rounded-b-xl">
                    <EditSection user={user} resetMsg={resetMsg} handleResetPassword={handleResetPassword} />
                </div>
            )}
        </div>
    )
}

// REUSABLE COMPONENTS (BADGE, EDIT SECTION)
function Badge({ children, variant }: { children: React.ReactNode, variant: "blue" | "green" | "yellow" | "muted" }) {
    const styles = {
        blue: "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10",
        green: "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10",
        yellow: "border-yellow-500/30 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
        muted: "border-border text-muted-foreground bg-muted"
    }
    return (
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold inline-block ${styles[variant]}`}>
            {children}
        </span>
    )
}

function EditSection({ user, resetMsg, handleResetPassword }: any) {
    return (
        <div className="flex flex-wrap gap-6">
            <form action={(formData) => adminUpdateName(user.id, formData)} className="flex items-end gap-2">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Display Name</label>
                    <input name="name" defaultValue={user.name ?? ""} className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground w-full sm:w-48 focus:ring-1 focus:ring-ring focus:outline-none" />
                </div>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90">Save</button>
            </form>

            {user.password ? (
                <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(user.id, new FormData(e.currentTarget)) }} className="flex items-end gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">New Password</label>
                        <input name="password" type="password" className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground w-full sm:w-48 focus:ring-1 focus:ring-ring focus:outline-none" />
                    </div>
                    <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90">Reset</button>
                </form>
            ) : (
                <div className="self-center py-1 px-3 rounded bg-muted text-xs text-muted-foreground italic">Google Auth User</div>
            )}

            {resetMsg[user.id] && (
                <p className={`text-xs self-center font-medium ${resetMsg[user.id].includes("updated") ? "text-green-500" : "text-destructive"}`}>
                    {resetMsg[user.id]}
                </p>
            )}
        </div>
    )
}
