"use server"
import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { signOut } from "@/auth"
import bcrypt from "bcryptjs"

export async function updateProfile(formData: FormData) {
    const user = await getCurrentDbUser()
    const name = String(formData.get("name") ?? "").trim()

    await prisma.user.update({
        where: { id: user.id },
        data: { name: name || null },
    })

    revalidatePath("/settings")
    return { success: true, name: name || null }
}

export async function changePassword(formData: FormData) {
    const user = await getCurrentDbUser()

    if (!user.password) {
        return { error: "Your account uses Google sign-in. Password change is not available." }
    }

    const current = String(formData.get("current") ?? "")
    const next = String(formData.get("next") ?? "")
    const confirm = String(formData.get("confirm") ?? "")

    if (!current || !next || !confirm) return { error: "All fields are required" }
    if (next.length < 8) return { error: "New password must be at least 8 characters" }
    if (next !== confirm) return { error: "Passwords do not match" }

    const valid = await bcrypt.compare(current, user.password)
    if (!valid) return { error: "Current password is incorrect" }

    const hashed = await bcrypt.hash(next, 12)
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
    })

    return { success: true }
}

export async function deleteAccount() {
    const user = await getCurrentDbUser()
    await prisma.user.delete({ where: { id: user.id } })
    await signOut({ redirectTo: "/sign-in" })
}