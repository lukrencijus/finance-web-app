"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentAdminUser } from "@/lib/current-user"
import bcrypt from "bcryptjs"

async function guardSelf(userId: string) {
    const currentUser = await getCurrentAdminUser()
    if (currentUser.id === userId) throw new Error("You cannot perform this action on yourself.")
    return currentUser
}

export async function approveUser(userId: string) {
    await guardSelf(userId)
    await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } })
    revalidatePath("/admin/users")
}

export async function revokeUser(userId: string) {
    await guardSelf(userId)
    await prisma.user.update({ where: { id: userId }, data: { status: "PENDING" } })
    revalidatePath("/admin/users")
}

export async function makeAdmin(userId: string) {
    await guardSelf(userId)
    await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN", status: "ACTIVE" } })
    revalidatePath("/admin/users")
}

export async function revokeAdmin(userId: string) {
    await guardSelf(userId)
    await prisma.user.update({ where: { id: userId }, data: { role: "USER" } })
    revalidatePath("/admin/users")
}

export async function deleteUser(userId: string) {
    await guardSelf(userId)
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath("/admin/users")
}

export async function adminUpdateName(userId: string, formData: FormData) {
    await getCurrentAdminUser()
    const name = String(formData.get("name") ?? "").trim()
    await prisma.user.update({
        where: { id: userId },
        data: { name: name || null },
    })
    revalidatePath("/admin/users")
}

export async function adminResetPassword(userId: string, formData: FormData) {
    await getCurrentAdminUser()
    const password = String(formData.get("password") ?? "")
    if (password.length < 8) return { error: "Password must be at least 8 characters" }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: "User not found" }
    if (!user.password) return { error: "This user uses Google sign-in, cannot set password" }
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashed },
    })
    revalidatePath("/admin/users")
    return { success: true }
}