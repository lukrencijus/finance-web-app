"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { capitalCategorySchema } from "@/lib/validations"

/**
 * At most one capital category per user may carry each moneyType, so assigning
 * CASH or BANK moves the flag off whichever category held it before.
 *
 * The cash/bank expected-vs-actual breakdown in lib/sheets.ts sums every
 * category of a given type, so allowing several would silently double-count a
 * user's cash against a single stream of CASH transactions.
 *
 * Pass `exceptId` when updating, so a category keeping its own flag is not
 * cleared out from under itself.
 */
async function releaseMoneyType(
    client: Pick<typeof prisma, "capitalCategory">,
    userId: string,
    moneyType: "CASH" | "BANK" | null | undefined,
    exceptId?: string,
) {
    if (!moneyType) return
    await client.capitalCategory.updateMany({
        where: {
            userId,
            moneyType,
            ...(exceptId ? { id: { not: exceptId } } : {}),
        },
        data: { moneyType: null },
    })
}

export async function createCapitalCategory(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()

    const rawMoneyType = String(formData.get("moneyType") ?? "").trim()

    const parsed = capitalCategorySchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
        color: String(formData.get("color") ?? "#64748B").trim(),
        moneyType: rawMoneyType === "CASH" || rawMoneyType === "BANK" ? rawMoneyType : null,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { name, icon, color, moneyType } = parsed.data

    const existing = await prisma.capitalCategory.findUnique({
        where: { userId_name: { userId: user.id, name } },
    })
    if (existing) return { error: `A capital category named "${name}" already exists.` }

    try {
        await prisma.$transaction(async (tx) => {
            await releaseMoneyType(tx, user.id, moneyType)
            await tx.capitalCategory.create({
                data: { name, icon: icon || null, color, moneyType: moneyType ?? null, userId: user.id },
            })
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

    const rawMoneyType = String(formData.get("moneyType") ?? "").trim()

    const parsed = capitalCategorySchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
        color: String(formData.get("color") ?? "#64748B").trim(),
        moneyType: rawMoneyType === "CASH" || rawMoneyType === "BANK" ? rawMoneyType : null,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { name, icon, color, moneyType } = parsed.data

    const category = await prisma.capitalCategory.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== user.id) return { error: "Not found or unauthorized" }

    await prisma.$transaction(async (tx) => {
        await releaseMoneyType(tx, user.id, moneyType, categoryId)
        await tx.capitalCategory.update({
            where: { id: categoryId },
            data: { name, icon: icon || null, color, moneyType: moneyType ?? null },
        })
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