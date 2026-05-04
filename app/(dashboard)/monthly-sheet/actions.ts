"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { transactionSchema, capitalSchema } from "@/lib/validations"

export async function createTransaction(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = transactionSchema.safeParse({
        amount: parseFloat(String(formData.get("amount") ?? "")),
        description: String(formData.get("description") ?? "").trim() || undefined,
        date: String(formData.get("date") ?? "").trim(),
        type: String(formData.get("type") ?? "").trim(),
        categoryId: String(formData.get("categoryId") ?? "").trim(),
        monthlySheetId: String(formData.get("monthlySheetId") ?? "").trim(),
    })

    // basic validation
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { amount, description, date, type, categoryId, monthlySheetId } = parsed.data

    // make sure the sheet belongs to this user
    const sheet = await prisma.monthlySheet.findUnique({
        where: { id: monthlySheetId },
    })
    if (!sheet || sheet.userId !== user.id) {
        return { error: "Unauthorized" }
    }

    const inputDate = new Date(date)
    if (
        inputDate.getMonth() + 1 !== sheet.month ||
        inputDate.getFullYear() !== sheet.year
    ) {
        return { error: "Date must be within this month" }
    }

    // let's make sure the category also belongs to this user
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    })
    if (!category || category.userId !== user.id) {
        return { error: "Invalid category" }
    }

    try {
        await prisma.transaction.create({
            data: {
                amount,
                description: description || null,
                date: date ? new Date(date) : new Date(),
                type,
                categoryId,
                monthlySheetId,
            },
        })
        revalidatePath("/monthly-sheet")
        return { success: true }
    } catch (e) {
        return { error: "Something went wrong. Please try again." }
    }
}

export async function deleteTransaction(transactionId: string) {
    const user = await getCurrentDbUser()

    // transaction -> sheet -> check userId
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { monthlySheet: true },
    })

    if (!transaction || transaction.monthlySheet.userId !== user.id) {
        return { error: "Not found or unauthorized" }
    }

    await prisma.transaction.delete({ where: { id: transactionId } })
    revalidatePath("/monthly-sheet")
}

export async function updateTransaction(transactionId: string, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = transactionSchema.safeParse({
        amount: parseFloat(String(formData.get("amount") ?? "")),
        description: String(formData.get("description") ?? "").trim() || undefined,
        date: String(formData.get("date") ?? "").trim(),
        type: String(formData.get("type") ?? "").trim(),
        categoryId: String(formData.get("categoryId") ?? "").trim(),
        monthlySheetId: String(formData.get("monthlySheetId") ?? ""),
    })

    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { amount, description, date, type, categoryId, monthlySheetId } = parsed.data

    // Verify transaction exists and belongs to user
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { monthlySheet: true },
    })

    if (!transaction || transaction.monthlySheet.userId !== user.id) {
        return { error: "Not found or unauthorized" }
    }

    // Validate date is within the sheet's month
    const inputDate = new Date(date)
    if (
        inputDate.getMonth() + 1 !== transaction.monthlySheet.month ||
        inputDate.getFullYear() !== transaction.monthlySheet.year
    ) {
        return { error: "Date must be within this month" }
    }

    // Verify category belongs to user
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== user.id) {
        return { error: "Invalid category" }
    }

    await prisma.transaction.update({
        where: { id: transactionId },
        data: { amount, description: description || null, date: new Date(date), categoryId },
    })

    revalidatePath("/monthly-sheet")
    return { success: true }
}

export async function createCapital(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = capitalSchema.safeParse({
        amount: parseFloat(String(formData.get("amount") ?? "")),
        capitalCategoryId: String(formData.get("capitalCategoryId") ?? "").trim(),
        monthlySheetId: String(formData.get("monthlySheetId") ?? "").trim(),
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { amount, capitalCategoryId, monthlySheetId } = parsed.data

    const sheet = await prisma.monthlySheet.findUnique({ where: { id: monthlySheetId } })
    if (!sheet || sheet.userId !== user.id) return { error: "Unauthorized" }

    const category = await prisma.capitalCategory.findUnique({ where: { id: capitalCategoryId } })
    if (!category || category.userId !== user.id) return { error: "Invalid category" }

    // One entry per category per sheet
    const existing = await prisma.capital.findFirst({
        where: { monthlySheetId, capitalCategoryId },
    })
    if (existing) return { error: "This category already has an entry for this month. Edit it instead." }

    try {
        await prisma.capital.create({
            data: { amount, capitalCategoryId, monthlySheetId },
        })
        revalidatePath("/monthly-sheet")
        return { success: true }
    } catch {
        return { error: "Something went wrong. Please try again." }
    }
}

export async function updateCapital(capitalId: string, formData: FormData) {
    const user = await getCurrentDbUser()

    const amount = parseFloat(String(formData.get("amount") ?? ""))
    if (isNaN(amount) || amount <= 0) return { error: "Amount must be greater than 0" }

    const capital = await prisma.capital.findUnique({
        where: { id: capitalId },
        include: { monthlySheet: true },
    })
    if (!capital || capital.monthlySheet.userId !== user.id) return { error: "Not found or unauthorized" }

    await prisma.capital.update({ where: { id: capitalId }, data: { amount } })
    revalidatePath("/monthly-sheet")
    return { success: true }
}

export async function deleteCapital(capitalId: string) {
    const user = await getCurrentDbUser()

    const capital = await prisma.capital.findUnique({
        where: { id: capitalId },
        include: { monthlySheet: true },
    })
    if (!capital || capital.monthlySheet.userId !== user.id) return { error: "Not found or unauthorized" }

    await prisma.capital.delete({ where: { id: capitalId } })
    revalidatePath("/monthly-sheet")
}

export async function reorderCapitals(orderedIds: string[]) {
    const user = await getCurrentDbUser()

    const capitals = await prisma.capital.findMany({
        where: { id: { in: orderedIds } },
        include: { monthlySheet: true },
    })
    if (capitals.some(c => c.monthlySheet.userId !== user.id)) return { error: "Unauthorized" }

    await Promise.all(
        orderedIds.map((id, index) =>
            prisma.capital.update({ where: { id }, data: { order: index } })
        )
    )
    revalidatePath("/monthly-sheet")
    return { success: true }
}