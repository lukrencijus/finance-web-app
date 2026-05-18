"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { transactionSchema, capitalSchema } from "@/lib/validations"

async function deleteSheetIfEmptyFuture(sheetId: string) {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const sheet = await prisma.monthlySheet.findUnique({
        where: { id: sheetId },
        select: {
            month: true,
            year: true,
            _count: { select: { transactions: true, capitals: true } },
        },
    })

    if (!sheet) return

    const isFuture =
        sheet.year > currentYear ||
        (sheet.year === currentYear && sheet.month > currentMonth)

    const isEmpty = sheet._count.transactions === 0 && sheet._count.capitals === 0

    if (isFuture && isEmpty) {
        await prisma.monthlySheet.delete({ where: { id: sheetId } })
    }
}

async function hasEditAccess(sheetOwnerId: string, currentUserId: string): Promise<boolean> {
    if (sheetOwnerId === currentUserId) return true
    const access = await prisma.sharedAccess.findUnique({
        where: {
            ownerId_sharedWithId: {
                ownerId: sheetOwnerId,
                sharedWithId: currentUserId
            }
        }
    })
    return access?.permission === "EDIT"
}

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

    const isRecurring = formData.get("isRecurring") === "true"

    // make sure the sheet belongs to this user
    const sheet = await prisma.monthlySheet.findUnique({
        where: { id: monthlySheetId },
    })
    if (!sheet || !await hasEditAccess(sheet.userId, user.id)) {
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
    if (!category || category.userId !== sheet.userId) {
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
                isRecurring,
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

    if (!transaction || !await hasEditAccess(transaction.monthlySheet.userId, user.id)) {
        return { error: "Not found or unauthorized" }
    }

    await prisma.transaction.delete({ where: { id: transactionId } })
    await deleteSheetIfEmptyFuture(transaction.monthlySheetId)
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

    if (!transaction || !await hasEditAccess(transaction.monthlySheet.userId, user.id)) {
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
    if (!category || category.userId !== transaction.monthlySheet.userId) {
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
    if (!sheet || !await hasEditAccess(sheet.userId, user.id)) return { error: "Unauthorized" }

    const category = await prisma.capitalCategory.findUnique({ where: { id: capitalCategoryId } })
    if (!category || category.userId !== sheet.userId) return { error: "Invalid category" }

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
    if (!capital || !await hasEditAccess(capital.monthlySheet.userId, user.id)) return { error: "Not found or unauthorized" }

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
    if (!capital || !await hasEditAccess(capital.monthlySheet.userId, user.id)) return { error: "Not found or unauthorized" }

    await prisma.capital.delete({ where: { id: capitalId } })
    revalidatePath("/monthly-sheet")
}

export async function toggleRecurring(transactionId: string) {
    const user = await getCurrentDbUser()

    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { monthlySheet: true },
    })

    if (!transaction || !await hasEditAccess(transaction.monthlySheet.userId, user.id)) {
        return { error: "Not found or unauthorized" }
    }

    await prisma.transaction.update({
        where: { id: transactionId },
        data: { isRecurring: !transaction.isRecurring },
    })

    revalidatePath("/monthly-sheet")
    return { success: true }
}

export async function createSplitTransaction(prevState: any, formData: FormData) {
    const user = await getCurrentDbUser()

    const amount = parseFloat(String(formData.get("amount") ?? ""))
    const description = String(formData.get("description") ?? "").trim() || undefined
    const date = String(formData.get("date") ?? "").trim()
    const type = String(formData.get("type") ?? "").trim()
    const categoryId = String(formData.get("categoryId") ?? "").trim()
    const monthlySheetId = String(formData.get("monthlySheetId") ?? "").trim()
    const splitMonths = parseInt(String(formData.get("splitMonths") ?? ""))

    if (isNaN(amount) || amount <= 0) return { error: "Amount must be greater than 0" }
    if (!date) return { error: "Date is required" }
    if (isNaN(splitMonths) || splitMonths < 2 || splitMonths > 24) {
        return { error: "Split must be between 2 and 24 months" }
    }

    // Verify the starting sheet belongs to user
    const startSheet = await prisma.monthlySheet.findUnique({
        where: { id: monthlySheetId },
    })
    if (!startSheet || !await hasEditAccess(startSheet.userId, user.id)) {
        return { error: "Unauthorized" }
    }

    // Verify category
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== startSheet.userId) {
        return { error: "Invalid category" }
    }

    const splitAmount = parseFloat((amount / splitMonths).toFixed(2))
    // Last part gets any rounding remainder
    const lastAmount = parseFloat((amount - splitAmount * (splitMonths - 1)).toFixed(2))

    const splitGroupId = crypto.randomUUID()
    const startDate = new Date(date)

    // Build all (month, year) pairs starting from the sheet's month
    const parts: { month: number; year: number; amount: number; date: Date }[] = []
    for (let i = 0; i < splitMonths; i++) {
        let m = startSheet.month + i
        let y = startSheet.year
        while (m > 12) { m -= 12; y += 1 }

        const lastDayOfMonth = new Date(y, m, 0).getDate()
        const day = Math.min(startDate.getDate(), lastDayOfMonth)
        const partDate = new Date(y, m - 1, day)
        const partAmount = i === splitMonths - 1 ? lastAmount : splitAmount

        parts.push({ month: m, year: y, amount: partAmount, date: partDate })
    }

    // Ensure all needed sheets exist (creates future sheets too)
    const sheetIds: Record<string, string> = {}
    sheetIds[`${startSheet.month}-${startSheet.year}`] = startSheet.id

    for (const part of parts) {
        const key = `${part.month}-${part.year}`
        if (sheetIds[key]) continue

        const existing = await prisma.monthlySheet.findUnique({
            where: {
                month_year_userId: {
                    month: part.month,
                    year: part.year,
                    userId: startSheet.userId,
                },
            },
        })

        if (existing) {
            sheetIds[key] = existing.id
        } else {
            const created = await prisma.monthlySheet.create({
                data: {
                    month: part.month,
                    year: part.year,
                    userId: startSheet.userId,
                },
            })
            sheetIds[key] = created.id
        }
    }

    // Create all split transactions
    await prisma.transaction.createMany({
        data: parts.map((part, i) => ({
            amount: part.amount,
            description: description || null,
            date: part.date,
            type,
            categoryId,
            monthlySheetId: sheetIds[`${part.month}-${part.year}`],
            isRecurring: false,
            splitMonths,
            splitIndex: i + 1,
            splitGroupId,
        })),
    })

    revalidatePath("/monthly-sheet")
    return { success: true }
}

export async function deleteSplitGroup(splitGroupId: string) {
    const user = await getCurrentDbUser()

    // Find all transactions in this group and verify ownership
    const transactions = await prisma.transaction.findMany({
        where: { splitGroupId },
        include: { monthlySheet: true },
    })

    if (transactions.length === 0) return { error: "Not found" }

    const allOwned = await Promise.all(
        transactions.map(t => hasEditAccess(t.monthlySheet.userId, user.id))
    )
    if (allOwned.some(v => !v)) return { error: "Unauthorized" }

    const sheetIds = [...new Set(transactions.map(t => t.monthlySheetId))]

    await prisma.transaction.deleteMany({ where: { splitGroupId } })

    // Clean up any future sheets that are now empty
    await Promise.all(sheetIds.map(deleteSheetIfEmptyFuture))

    revalidatePath("/monthly-sheet")
    return { success: true }
}
