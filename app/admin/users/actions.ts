"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentAdminUser } from "@/lib/current-user"

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