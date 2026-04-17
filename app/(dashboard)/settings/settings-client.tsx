"use client"
import { useState } from "react"
import { updateProfile, changePassword, deleteAccount } from "./actions"

type Props = {
    initialName: string
    email: string
    hasPassword: boolean
    isAdmin: boolean
}

export default function SettingsClient({ initialName, email, hasPassword, isAdmin }: Props) {
    const [name, setName] = useState(initialName)
    const [profileMsg, setProfileMsg] = useState<string | null>(null)
    const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState(false)

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
        <div className="max-w-lg mx-auto py-8 space-y-10">
            <h1 className="text-3xl font-semibold">Settings</h1>

            {/* Profile */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-medium">Profile</h2>
                    <p className="text-sm text-muted-foreground">Update your display name.</p>
                </div>
                <form onSubmit={handleProfile} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            disabled
                            value={email}
                            className="w-full border rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Name</label>
                        <input
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        />
                    </div>
                    {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
                    <button
                        type="submit"
                        className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90"
                    >
                        Save
                    </button>
                </form>
            </section>

            <hr />

            {/* Password */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-medium">Security</h2>
                    <p className="text-sm text-muted-foreground">
                        {hasPassword ? "Change your password." : "Your account uses Google sign-in — password change is not available."}
                    </p>
                </div>
                {hasPassword && (
                    <form onSubmit={handlePassword} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Current password</label>
                            <input name="current" type="password" className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">New password</label>
                            <input name="next" type="password" className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Confirm new password</label>
                            <input name="confirm" type="password" className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                        </div>
                        {passwordMsg && (
                            <p className={`text-sm ${passwordMsg.includes("successfully") ? "text-green-600" : "text-destructive"}`}>
                                {passwordMsg}
                            </p>
                        )}
                        <button
                            type="submit"
                            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90"
                        >
                            Change password
                        </button>
                    </form>
                )}
            </section>

            <hr />

            {/* Danger zone */}
            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-medium text-destructive">Danger Zone</h2>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all your data.</p>
                </div>
                {isAdmin ? (
                    <p className="text-sm text-muted-foreground">
                        Admin accounts cannot be deleted.
                    </p>
                ) : !deleteConfirm ? (
                    <button
                        onClick={() => setDeleteConfirm(true)}
                        className="rounded-md border border-destructive text-destructive px-4 py-2 text-sm hover:bg-destructive/10"
                    >
                        Delete my account
                    </button>
                ) : (
                    <div className="rounded-xl border border-destructive p-4 space-y-3">
                        <p className="text-sm font-medium">Are you sure? This cannot be undone.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                className="rounded-md bg-destructive text-white px-4 py-2 text-sm hover:opacity-90"
                            >
                                Yes, delete everything
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}