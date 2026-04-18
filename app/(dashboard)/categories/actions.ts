"use server"
import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"

export async function createCategory(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()
    const name = String(formData.get("name") ?? "").trim()
    const type = String(formData.get("type") ?? "").trim()
    const icon = String(formData.get("icon") ?? "").trim()

    if (!name || !type) return { error: "Name and Type are required" }
    
    // Check if it already exists
    const existing = await prisma.category.findUnique({
        where: { 
            userId_type_name: { 
                userId: user.id, 
                type: type as any, 
                name 
            } 
        },
    })

    if (existing) {
        return { error: `A ${type.toLowerCase()} category named "${name}" already exists.` }
    }

    try {
        await prisma.category.create({
            data: { name, type, icon: icon || null, userId: user.id },
        })
        revalidatePath("/categories")
        return { success: true }
    } catch (e) {
        return { error: "Something went wrong. Please try again." }
    }
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