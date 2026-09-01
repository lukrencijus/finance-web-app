"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Users, ChevronDown, Mail, X, UserMinus, Pencil, Check, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { inviteToApartment, cancelInvite, removeMember, renameApartment, deleteApartment } from "./actions"

export type ApartmentSummary = {
    id: string
    name: string
    /** OWNER or MEMBER - only the owner may invite, remove and rename. */
    myRole: string
    members: { id: string; role: string; userId: string; name: string | null; email: string }[]
    invites: { id: string; email: string }[]
}

/**
 * Membership management for the apartment: who is in it, who has been invited,
 * and the destructive bits. Collapsed by default - it is setup, not everyday use.
 */
export function ApartmentPanel({
    apartment,
    currentUserId,
}: {
    apartment: ApartmentSummary
    currentUserId: string
}) {
    const [open, setOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [renaming, setRenaming] = useState(false)
    const [name, setName] = useState(apartment.name)
    const [error, setError] = useState<string | null>(null)
    const [confirming, setConfirming] = useState<null | { kind: "member"; id: string; label: string } | { kind: "apartment" }>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const isOwner = apartment.myRole === "OWNER"

    const run = (fn: () => Promise<{ error?: string } | undefined>, onDone?: () => void) => {
        setError(null)
        startTransition(async () => {
            const result = await fn()
            if (result?.error) setError(result.error)
            else {
                onDone?.()
                router.refresh()
            }
        })
    }

    const handleInvite = () => {
        const fd = new FormData()
        fd.append("email", inviteEmail)
        run(() => inviteToApartment(apartment.id, fd), () => setInviteEmail(""))
    }

    const handleRename = () => {
        const fd = new FormData()
        fd.append("name", name)
        run(() => renameApartment(apartment.id, fd), () => setRenaming(false))
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <Users className="size-4 text-primary" />
                </div>
                <span className="flex-1 text-left text-sm font-semibold">
                    Apartment & members
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {apartment.members.length}
                        {apartment.invites.length > 0 && ` + ${apartment.invites.length} invited`}
                    </span>
                </span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    {/* Name */}
                    {isOwner && (
                        <div className="flex items-center gap-2">
                            {renaming ? (
                                <>
                                    <input value={name} onChange={e => setName(e.target.value)} autoFocus
                                        onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false) }}
                                        className="flex-1 border border-input rounded-xl px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                                    <button onClick={handleRename} disabled={isPending}
                                        className="text-green-600 dark:text-green-400 p-1 disabled:opacity-50">
                                        <Check className="size-4" />
                                    </button>
                                    <button onClick={() => { setRenaming(false); setName(apartment.name) }}
                                        className="text-red-600 dark:text-red-400 p-1">
                                        <X className="size-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 text-sm font-medium truncate">{apartment.name}</span>
                                    <button onClick={() => setRenaming(true)}
                                        className="text-muted-foreground/40 hover:text-blue-500 p-1 transition-colors">
                                        <Pencil className="size-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Members */}
                    <ul className="space-y-1">
                        {apartment.members.map(member => (
                            <li key={member.id} className="flex items-center gap-2 text-sm">
                                <span className="size-7 rounded-xl bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                    {(member.name ?? member.email).charAt(0).toUpperCase()}
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block truncate">
                                        {member.name ?? member.email}
                                        {member.userId === currentUserId && (
                                            <span className="text-xs text-muted-foreground"> (you)</span>
                                        )}
                                    </span>
                                    <span className="block text-[11px] text-muted-foreground truncate">
                                        {member.role === "OWNER" ? "Owner" : "Member"}
                                    </span>
                                </span>
                                {member.role !== "OWNER" && (isOwner || member.userId === currentUserId) && (
                                    <button
                                        onClick={() => setConfirming({
                                            kind: "member",
                                            id: member.id,
                                            label: member.userId === currentUserId ? "yourself" : (member.name ?? member.email),
                                        })}
                                        className="text-muted-foreground/40 hover:text-destructive p-1 transition-colors">
                                        <UserMinus className="size-3.5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Pending invites */}
                    {apartment.invites.length > 0 && (
                        <ul className="space-y-1">
                            {apartment.invites.map(invite => (
                                <li key={invite.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="size-7 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                                        <Mail className="size-3.5" />
                                    </span>
                                    <span className="flex-1 min-w-0 truncate">
                                        {invite.email}
                                        <span className="block text-[11px]">Invited, waiting to join</span>
                                    </span>
                                    {isOwner && (
                                        <button onClick={() => run(() => cancelInvite(invite.id))}
                                            className="text-muted-foreground/40 hover:text-destructive p-1 transition-colors">
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Invite */}
                    {isOwner && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleInvite() }}
                                    type="email"
                                    inputMode="email"
                                    autoComplete="off"
                                    placeholder="their@email.com"
                                    className="flex-1 border border-input bg-background rounded-xl px-3 py-2 text-base lg:text-sm min-w-0 focus:outline-none focus:ring-1 focus:ring-ring" />
                                <button onClick={handleInvite} disabled={isPending || !inviteEmail}
                                    className="bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 shrink-0">
                                    Invite
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                They need their own account here first. If they have not registered yet,
                                the invite waits for them — it appears once an admin approves their account.
                            </p>
                        </div>
                    )}

                    {error && <p className="text-xs text-destructive">{error}</p>}

                    {isOwner && (
                        <button onClick={() => setConfirming({ kind: "apartment" })}
                            className="flex items-center gap-1.5 text-xs font-medium text-destructive/70 hover:text-destructive transition-colors">
                            <Trash2 className="size-3.5" />
                            Delete apartment
                        </button>
                    )}
                </div>
            )}

            <ConfirmDialog
                open={confirming?.kind === "member"}
                title="Remove from apartment?"
                message={
                    confirming?.kind === "member"
                        ? `This removes ${confirming.label} from "${apartment.name}". The recorded months stay.`
                        : ""
                }
                confirmLabel="Remove"
                pendingLabel="Removing..."
                icon={UserMinus}
                isPending={isPending}
                onCancel={() => setConfirming(null)}
                onConfirm={() => {
                    if (confirming?.kind !== "member") return
                    const id = confirming.id
                    run(() => removeMember(id), () => setConfirming(null))
                }}
            />

            <ConfirmDialog
                open={confirming?.kind === "apartment"}
                title={`Delete "${apartment.name}"?`}
                message="Every recorded month, cost category and membership is permanently deleted. This cannot be undone."
                isPending={isPending}
                onCancel={() => setConfirming(null)}
                onConfirm={() => run(() => deleteApartment(apartment.id), () => setConfirming(null))}
            />
        </div>
    )
}
