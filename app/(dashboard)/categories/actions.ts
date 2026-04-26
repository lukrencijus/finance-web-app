"use server"
import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { categorySchema } from "@/lib/validations"

export async function createCategory(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = categorySchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        type: String(formData.get("type") ?? "").trim(),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
    })

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { name, type, icon } = parsed.data
        
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
        revalidatePath("/monthly-sheet")
        return { success: true }
    } catch (e) {
        return { error: "Something went wrong. Please try again." }
    }
}

export async function getCategoryTransactions(categoryId: string) {
    const user = await getCurrentDbUser()

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            transactions: {
                include: { monthlySheet: true },
                orderBy: { date: "desc" },
            },
        },
    })

    if (!category || category.userId !== user.id) return []
    return category.transactions
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

    const parsed = categorySchema.pick({ name: true, icon: true }).safeParse({
        name: String(formData.get("name") ?? "").trim(),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
    })

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { name, icon } = parsed.data

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== user.id) {
        return { error: "Not found or unauthorized" }
    }

    await prisma.category.update({
        where: { id: categoryId },
        data: { name, icon: icon || null },
    })

    revalidatePath("/categories")
    return { success: true }
}

export async function reorderCategories(orderedIds: string[]) {
    const user = await getCurrentDbUser()

    // Verify all categories belong to this user before updating
    const categories = await prisma.category.findMany({
        where: { id: { in: orderedIds }, userId: user.id },
    })
    if (categories.length !== orderedIds.length) {
        return { error: "Unauthorized" }
    }

    await Promise.all(
        orderedIds.map((id, index) =>
            prisma.category.update({
                where: { id },
                data: { order: index },
            })
        )
    )

    revalidatePath("/categories")
    revalidatePath("/monthly-sheet")
    return { success: true }
}