"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { transactionSchema } from "@/lib/validations"

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
        throw new Error("Not found or unauthorized")
    }

    await prisma.transaction.delete({ where: { id: transactionId } })
    revalidatePath("/monthly-sheet")
}