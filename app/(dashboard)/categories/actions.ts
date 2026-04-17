"use server"
import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"

export async function createCategory(formData: FormData) {
    const user = await getCurrentDbUser()
    const name = String(formData.get("name") ?? "").trim()
    const type = String(formData.get("type") ?? "").trim()
    const icon = String(formData.get("icon") ?? "").trim()

    if (!name || !type) return
    if (type !== "INCOME" && type !== "EXPENSE") return

    const existing = await prisma.category.findUnique({
        where: { userId_type_name: { userId: user.id, type, name } },
    })
    if (existing) return

    await prisma.category.create({
        data: { name, type, icon: icon || null, userId: user.id },
    })

    revalidatePath("/categories")
}

export async function deleteCategory(categoryId: string) {
    const user = await getCurrentDbUser()

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    })
    if (!category || category.userId !== user.id) {
        throw new Error("Not found or unauthorized")
    }

    await prisma.category.delete({ where: { id: categoryId } })
    revalidatePath("/categories")
}

export async function updateCategory(categoryId: string, formData: FormData) {
    const user = await getCurrentDbUser()
    const name = String(formData.get("name") ?? "").trim()
    const icon = String(formData.get("icon") ?? "").trim()

    if (!name) return

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    })
    if (!category || category.userId !== user.id) {
        throw new Error("Not found or unauthorized")
    }

    await prisma.category.update({
        where: { id: categoryId },
        data: { name, icon: icon || null },
    })

    revalidatePath("/categories")
}