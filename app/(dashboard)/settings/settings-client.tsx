"use client"
import { useEffect, useState } from "react"
import { updateProfile, changePassword, deleteAccount, shareProfile, revokeShare, updatePermission } from "./actions"
import { useTheme } from "next-themes"
import { Sun, Moon, Check, XCircle, Share2, UserMinus, ExternalLink } from "lucide-react"
import Link from "next/link"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-32 h-9 rounded-md border border-border bg-card" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-accent text-foreground transition-colors text-sm font-medium"
      >
        {resolvedTheme === "dark" ? (
          <>
            <Sun className="size-4 text-yellow-500" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="size-4 text-blue-500" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    </div>
  )
}

type SharingData = {
    sharedWithOthers: {
        permission: string
        sharedWith: { id: string; email: string; name: string | null }
    }[]
    sharedWithMe: {
        permission: string
        owner: { id: string; email: string; name: string | null }
    }[]
}

type Props = {
    initialName: string
    email: string
    hasPassword: boolean
    isAdmin: boolean
    sharing: SharingData
}

export default function SettingsClient({ initialName, email, hasPassword, isAdmin, sharing }: Props) {
    const [name, setName] = useState(initialName)
    const [profileMsg, setProfileMsg] = useState<string | null>(null)
    const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState(false)

    const [revokingId, setRevokingId] = useState<string | null>(null)
    const [shareMsg, setShareMsg] = useState<{ error?: string; success?: boolean } | null>(null)
    const [shareEmail, setShareEmail] = useState("")
    const [sharePermission, setSharePermission] = useState<"VIEW" | "EDIT">("VIEW")

    async function handleShare(e: React.FormEvent) {
        e.preventDefault()
        setShareMsg(null)
        const res = await shareProfile(shareEmail, sharePermission)
        
        if ("error" in res) {
            setShareMsg({ error: res.error })
        } else {
            setShareMsg({ success: true })
            setShareEmail("")
            setSharePermission("VIEW")
        }
    }

    async function handleRevoke(id: string) {
        setRevokingId(id)
        await revokeShare(id)
        setRevokingId(null)
    }

    async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const result = await updateProfile(formData)
        if (result.success) {
            setProfileMsg("Name updated successfully.")
        }
    }

    async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const result = await changePassword(formData)
        if ("error" in result) {
            setPasswordMsg(result.error ?? "An error occurred.")
        } else {
            setPasswordMsg("Password changed successfully.")
            ;(e.target as HTMLFormElement).reset()
        }
    }

    async function handleDelete() {
        await deleteAccount()
    }

    return (
        <div className="max-w-lg mx-auto py-8 px-4 space-y-10 text-foreground">
            <h1 className="text-3xl font-semibold">Settings</h1>

            <section className="space-y-4">
                <h2 className="text-lg font-medium">Appearance</h2>
                <p className="text-sm text-muted-foreground">Toggle between light and dark mode.</p>
                <ThemeToggle />
            </section>

            <hr className="border-border" />

            <section className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">Sharing</h2>
                    <p className="text-sm text-muted-foreground">Manage who can view your financial monthly reports.</p>
                </div>

                {/* Form to share with someone */}
                <form onSubmit={handleShare} className="space-y-3">
                    <label className="text-sm font-medium">Share your profile (Email)</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
                            required
                        />
                        <select
                            value={sharePermission}
                            onChange={(e) => setSharePermission(e.target.value as "VIEW" | "EDIT")}
                            className="border border-input rounded-md px-2 py-2 text-sm bg-background text-foreground"
                        >
                            <option value="VIEW">View</option>
                            <option value="EDIT">Edit</option>
                        </select>
                        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
                            Share
                        </button>
                    </div>
                    {shareMsg?.error && <p className="text-xs text-destructive">{shareMsg.error}</p>}
                    {shareMsg?.success && <p className="text-xs text-green-600">Shared successfully!</p>}
                </form>

                {/* People who can see my profile */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">People you share with</h3>
                    {sharing.sharedWithOthers.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">You have not shared your profile with anyone yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {sharing.sharedWithOthers.map((s) => (
                                <div key={s.sharedWith.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                                    <div className="text-sm">
                                        <p className="font-medium">{s.sharedWith.name || "User"}</p>
                                        <p className="text-xs text-muted-foreground">{s.sharedWith.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={s.permission}
                                            onChange={(e) => updatePermission(s.sharedWith.id, e.target.value as "VIEW" | "EDIT")}
                                            className="border border-input rounded-md px-2 py-1 text-xs bg-background text-foreground"
                                        >
                                            <option value="VIEW">View</option>
                                            <option value="EDIT">Edit</option>
                                        </select>
                                        <button onClick={() => handleRevoke(s.sharedWith.id)} disabled={revokingId === s.sharedWith.id} className="text-destructive p-2 hover:bg-destructive/10 rounded-full transition-colors disabled:opacity-40">
                                            <UserMinus className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Profiles shared with me */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Profiles shared with you</h3>
                    {sharing.sharedWithMe.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No one has shared their profile with you yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {sharing.sharedWithMe.map((s) => (
                                <div key={s.owner.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                                    <div className="text-sm">
                                        <p className="font-medium">{s.owner.name || "User"}</p>
                                        <p className="text-xs text-muted-foreground">{s.owner.email}</p>
                                    </div>
                                    <Link href={`/shared/${s.owner.id}`} className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:underline">
                                        <ExternalLink className="size-3.5" />
                                        View
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>


            <hr className="border-border" />

            {/* Profile */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-medium">Profile</h2>
                    <p className="text-sm text-muted-foreground">Update your display name.</p>
                </div>
                <form onSubmit={handleProfile} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            disabled
                            value={email}
                            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                        />
                        <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Name</label>
                        <input
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                    </div>
                    {profileMsg && <p className="text-sm font-medium text-green-600 dark:text-green-400">{profileMsg}</p>}
                    <button
                        type="submit"
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                        <Check className="size-3.5" />
                        Save Changes
                    </button>
                </form>
            </section>

            <hr className="border-border" />

            {/* Password */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-medium">Security</h2>
                    <p className="text-sm text-muted-foreground">
                        {hasPassword ? "Change your account password." : "Your account uses Google sign-in, password change is not available."}
                    </p>
                </div>
                {hasPassword && (
                    <form onSubmit={handlePassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Current password</label>
                            <input name="current" type="password" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">New password</label>
                            <input name="next" type="password" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Confirm new password</label>
                            <input name="confirm" type="password" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
                        </div>
                        {passwordMsg && (
                            <p className={`text-sm font-medium ${passwordMsg.includes("successfully") ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                                {passwordMsg}
                            </p>
                        )}
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
                        >
                            <Check className="size-3.5" />
                            Update Password
                        </button>
                    </form>
                )}
            </section>

            <hr className="border-border" />

            {/* Danger zone */}
            <section className="space-y-4 pb-12">
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                    <h2 className="text-lg font-medium text-destructive">Danger Zone</h2>
                    <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all your data. This action is irreversible.</p>
                    
                    {isAdmin ? (
                        <p className="text-xs font-semibold text-destructive/80 bg-destructive/10 px-3 py-2 rounded-md">
                            Note: Admin accounts cannot be deleted.
                        </p>
                    ) : !deleteConfirm ? (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="flex items-center gap-1.5 rounded-md border border-destructive text-destructive px-3 py-1.5 text-xs font-medium hover:bg-destructive hover:text-white transition-all"
                        >
                            <XCircle className="size-3.5" />
                            Delete Account
                        </button>
                    ) : (
                        <div className="mt-4 p-4 rounded-lg bg-background border border-destructive space-y-4 shadow-lg animate-in fade-in zoom-in-95">
                            <p className="text-sm font-bold text-foreground">Are you absolutely sure? This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    className="rounded-md bg-destructive text-white px-4 py-2 text-sm font-medium hover:opacity-90"
                                >
                                    Yes, delete everything
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(false)}
                                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
