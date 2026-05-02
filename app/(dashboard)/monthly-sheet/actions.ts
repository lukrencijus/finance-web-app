"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { transactionSchema, capitalSchema } from "@/lib/validations"
import { getMonthlyInsights } from "@/lib/sheets"

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

// Capital CRUD
export async function createCapital(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = capitalSchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        amount: parseFloat(String(formData.get("amount") ?? "")),
        monthlySheetId: String(formData.get("monthlySheetId") ?? "").trim(),
    })

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }

    const { name, amount, monthlySheetId } = parsed.data

    const sheet = await prisma.monthlySheet.findUnique({ where: { id: monthlySheetId } })
    if (!sheet || sheet.userId !== user.id) {
        return { error: "Unauthorized" }
    }

    // Max 10 capital entries per sheet
    const count = await prisma.capital.count({ where: { monthlySheetId } })
    if (count >= 10) {
        return { error: "Maximum 10 capital entries per month" }
    }

    await prisma.capital.create({
        data: { name, amount, monthlySheetId },
    })

    revalidatePath("/monthly-sheet")
    return { success: true }
}

export async function updateCapital(capitalId: string, formData: FormData) {
    const user = await getCurrentDbUser()

    const parsed = capitalSchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        amount: parseFloat(String(formData.get("amount") ?? "")),
        monthlySheetId: String(formData.get("monthlySheetId") ?? "").trim(),
    })

    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { name, amount, monthlySheetId } = parsed.data

    const capital = await prisma.capital.findUnique({
        where: { id: capitalId },
        include: { monthlySheet: true },
    })

    if (!capital || capital.monthlySheet.userId !== user.id) {
        return { error: "Not found or unauthorized" }
    }

    await prisma.capital.update({
        where: { id: capitalId },
        data: { name, amount },
    })

    revalidatePath("/monthly-sheet")
    return { success: true }
}

export async function deleteCapital(capitalId: string) {
    const user = await getCurrentDbUser()

    const capital = await prisma.capital.findUnique({
        where: { id: capitalId },
        include: { monthlySheet: true },
    })

    if (!capital || capital.monthlySheet.userId !== user.id) {
        return { error: "Not found or unauthorized" }
    }

    await prisma.capital.delete({ where: { id: capitalId } })
    revalidatePath("/monthly-sheet")
}

// Insights
export async function fetchMonthlyInsights(month: number, year: number) {
    const user = await getCurrentDbUser()
    return getMonthlyInsights(user.id, month, year)
}