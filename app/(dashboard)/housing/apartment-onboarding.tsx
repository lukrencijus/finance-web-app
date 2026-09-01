"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Home, Mail, Check, X } from "lucide-react"
import { createApartmentAction, respondToInvite } from "./actions"

type Invite = {
    id: string
    apartment: { id: string; name: string }
    invitedBy: { name: string | null; email: string }
}

/**
 * Shown to anyone who is not in an apartment yet. Two ways in: start one, or
 * accept an invite that is already waiting on your email address.
 */
export function ApartmentOnboarding({ invites }: { invites: Invite[] }) {
    const [name, setName] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleCreate = () => {
        setError(null)
        const fd = new FormData()
        fd.append("name", name)
        startTransition(async () => {
            const result = await createApartmentAction(null, fd)
            if (result?.error) setError(result.error)
            else router.refresh()
        })
    }

    const handleInvite = (inviteId: string, accept: boolean) => {
        setError(null)
        startTransition(async () => {
            const result = await respondToInvite(inviteId, accept)
            if (result?.error) setError(result.error)
            else router.refresh()
        })
    }

    return (
        <div className="max-w-lg mx-auto py-8 space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Home className="size-8 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold">Housing costs</h1>
                <p className="text-sm text-muted-foreground">
                    Track rent, parking and utilities month by month, together with whoever
                    you live with.
                </p>
            </div>

            {invites.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                        Invitations
                    </p>
                    {invites.map(invite => (
                        <div key={invite.id}
                            className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
                            <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                                <Mail className="size-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{invite.apartment.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    from {invite.invitedBy.name ?? invite.invitedBy.email}
                                </p>
                            </div>
                            <button onClick={() => handleInvite(invite.id, true)} disabled={isPending}
                                className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50">
                                <Check className="size-3.5" /> Join
                            </button>
                            <button onClick={() => handleInvite(invite.id, false)} disabled={isPending}
                                className="text-muted-foreground hover:text-destructive p-1.5 disabled:opacity-50">
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-sm font-semibold">Start an apartment</p>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreate() }}
                    placeholder="e.g. Our flat"
                    className="w-full border border-input bg-background text-foreground rounded-xl px-3 py-2 text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={handleCreate} disabled={isPending}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {isPending ? "Creating..." : "Create apartment"}
                </button>
                <p className="text-xs text-muted-foreground">
                    Comes with the usual cost categories, all of which you can rename or remove.
                    You can invite the person you live with afterwards.
                </p>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
    )
}
