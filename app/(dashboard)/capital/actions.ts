"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { capitalCategorySchema } from "@/lib/validations"

export async function createCapitalCategory(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = capitalCategorySchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { name, icon } = parsed.data

    const existing = await prisma.capitalCategory.findUnique({
        where: { userId_name: { userId: user.id, name } },
    })
    if (existing) return { error: `A capital category named "${name}" already exists.` }

    try {
        await prisma.capitalCategory.create({
            data: { name, icon: icon || null, userId: user.id },
        })
        revalidatePath("/capitals")
        revalidatePath("/monthly-sheet")
        return { success: true }
    } catch {
        return { error: "Something went wrong. Please try again." }
    }
}

export async function updateCapitalCategory(categoryId: string, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = capitalCategorySchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { name, icon } = parsed.data

    const category = await prisma.capitalCategory.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== user.id) return { error: "Not found or unauthorized" }

    await prisma.capitalCategory.update({
        where: { id: categoryId },
        data: { name, icon: icon || null },
    })
    revalidatePath("/capitals")
    revalidatePath("/monthly-sheet")
    return { success: true }
}

export async function deleteCapitalCategory(categoryId: string) {
    const user = await getCurrentDbUser()

    const category = await prisma.capitalCategory.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== user.id) throw new Error("Not found or unauthorized")

    await prisma.capitalCategory.delete({ where: { id: categoryId } })
    revalidatePath("/capitals")
    revalidatePath("/monthly-sheet")
}

export async function getCapitalCategoryCapitals(categoryId: string) {
    const user = await getCurrentDbUser()

    const category = await prisma.capitalCategory.findUnique({
        where: { id: categoryId },
        include: {
            capitals: {
                include: { monthlySheet: true },
                orderBy: { monthlySheet: { month: "desc" } },
            },
        },
    })
    if (!category || category.userId !== user.id) return []
    return category.capitals
}

export async function reorderCapitalCategories(orderedIds: string[]) {
    const user = await getCurrentDbUser()

    const categories = await prisma.capitalCategory.findMany({
        where: { id: { in: orderedIds }, userId: user.id },
    })
    if (categories.length !== orderedIds.length) return { error: "Unauthorized" }

    await Promise.all(
        orderedIds.map((id, index) =>
            prisma.capitalCategory.update({ where: { id }, data: { order: index } })
        )
    )
    revalidatePath("/capitals")
    revalidatePath("/monthly-sheet")
    return { success: true }
}