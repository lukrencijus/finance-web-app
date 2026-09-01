"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentDbUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import {
    apartmentSchema,
    apartmentInviteSchema,
    housingCategorySchema,
    housingEntrySchema,
    parseOptionalAmount,
} from "@/lib/validations"
import { createApartment, getMembership, getOrCreateHousingMonth } from "@/lib/housing"

/**
 * Every housing mutation funnels through here: being a member of the apartment
 * is the whole authorization model. `requireOwner` additionally gates the
 * membership changes (inviting, removing) to whoever created the apartment.
 */
async function authorize(apartmentId: string, requireOwner = false) {
    const user = await getCurrentDbUser()
    const membership = await getMembership(apartmentId, user.id)
    if (!membership) return { error: "Unauthorized" as const, user: null, membership: null }
    if (requireOwner && membership.role !== "OWNER") {
        return { error: "Only the apartment owner can do this" as const, user: null, membership: null }
    }
    return { error: null, user, membership }
}

/** Resolves a category or month id back to its apartment before authorizing. */
async function authorizeCategory(categoryId: string) {
    const category = await prisma.housingCategory.findUnique({ where: { id: categoryId } })
    if (!category) return { error: "Not found" as const, category: null }
    const { error } = await authorize(category.apartmentId)
    if (error) return { error, category: null }
    return { error: null, category }
}

// ---------------------------------------------------------------- apartment

export async function createApartmentAction(prevState: unknown, formData: FormData) {
    const user = await getCurrentDbUser()

    const existing = await prisma.apartmentMember.findFirst({ where: { userId: user.id } })
    if (existing) return { error: "You already belong to an apartment." }

    const parsed = apartmentSchema.safeParse({ name: String(formData.get("name") ?? "").trim() })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await createApartment(user.id, parsed.data.name)
    revalidatePath("/housing")
    return { success: true }
}

export async function renameApartment(apartmentId: string, formData: FormData) {
    const { error } = await authorize(apartmentId, true)
    if (error) return { error }

    const parsed = apartmentSchema.safeParse({ name: String(formData.get("name") ?? "").trim() })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await prisma.apartment.update({ where: { id: apartmentId }, data: { name: parsed.data.name } })
    revalidatePath("/housing")
    return { success: true }
}

// ------------------------------------------------------------------ members

export async function inviteToApartment(apartmentId: string, formData: FormData) {
    const { error, user } = await authorize(apartmentId, true)
    if (error) return { error }

    const parsed = apartmentInviteSchema.safeParse({ email: String(formData.get("email") ?? "") })
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    const { email } = parsed.data

    if (email === user.email.toLowerCase()) return { error: "That is your own email." }

    // The invitee may not have an account yet - the invite waits for them. But
    // if they do exist and are already in, say so instead of leaving a dead
    // invite lying around.
    const invitee = await prisma.user.findUnique({ where: { email } })
    if (invitee) {
        const alreadyMember = await getMembership(apartmentId, invitee.id)
        if (alreadyMember) return { error: "They are already a member of this apartment." }
    }

    const existing = await prisma.apartmentInvite.findUnique({
        where: { apartmentId_email: { apartmentId, email } },
    })
    if (existing?.status === "PENDING") return { error: "They have already been invited." }

    await prisma.apartmentInvite.upsert({
        where: { apartmentId_email: { apartmentId, email } },
        create: { apartmentId, email, invitedById: user.id },
        update: { status: "PENDING", invitedById: user.id },
    })
    revalidatePath("/housing")
    return { success: true }
}

export async function cancelInvite(inviteId: string) {
    const invite = await prisma.apartmentInvite.findUnique({ where: { id: inviteId } })
    if (!invite) return { error: "Not found" }

    const { error } = await authorize(invite.apartmentId, true)
    if (error) return { error }

    await prisma.apartmentInvite.delete({ where: { id: inviteId } })
    revalidatePath("/housing")
    return { success: true }
}

export async function respondToInvite(inviteId: string, accept: boolean) {
    const user = await getCurrentDbUser()

    const invite = await prisma.apartmentInvite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.status !== "PENDING") return { error: "This invite is no longer available." }
    if (invite.email !== user.email.toLowerCase()) return { error: "Unauthorized" }

    if (!accept) {
        await prisma.apartmentInvite.update({
            where: { id: inviteId },
            data: { status: "DECLINED" },
        })
        revalidatePath("/housing")
        return { success: true }
    }

    // One apartment per person in the UI: joining a second one would silently
    // hide it, since /housing shows the oldest membership.
    const existing = await prisma.apartmentMember.findFirst({ where: { userId: user.id } })
    if (existing) return { error: "Leave your current apartment before joining another." }

    await prisma.$transaction([
        prisma.apartmentMember.create({
            data: { apartmentId: invite.apartmentId, userId: user.id, role: "MEMBER" },
        }),
        prisma.apartmentInvite.update({
            where: { id: inviteId },
            data: { status: "ACCEPTED" },
        }),
    ])
    revalidatePath("/housing")
    return { success: true }
}

export async function removeMember(memberId: string) {
    const user = await getCurrentDbUser()

    const member = await prisma.apartmentMember.findUnique({ where: { id: memberId } })
    if (!member) return { error: "Not found" }

    // Anyone may remove themselves (leave); only the owner may remove others.
    const isSelf = member.userId === user.id
    const { error } = await authorize(member.apartmentId, !isSelf)
    if (error) return { error }

    if (member.role === "OWNER") {
        return { error: "The owner cannot leave. Delete the apartment instead." }
    }

    const removedUser = await prisma.user.findUnique({
        where: { id: member.userId },
        select: { email: true },
    })

    await prisma.apartmentMember.delete({ where: { id: memberId } })

    // Clear their accepted invite so they can be invited again later. Guarded on
    // the email actually being known: an undefined `email` here would match -
    // and delete - every invite the apartment has.
    if (removedUser) {
        await prisma.apartmentInvite.deleteMany({
            where: { apartmentId: member.apartmentId, email: removedUser.email.toLowerCase() },
        })
    }
    revalidatePath("/housing")
    return { success: true }
}

export async function deleteApartment(apartmentId: string) {
    const { error } = await authorize(apartmentId, true)
    if (error) return { error }

    await prisma.apartment.delete({ where: { id: apartmentId } })
    revalidatePath("/housing")
    return { success: true }
}

// --------------------------------------------------------------- categories

export async function createHousingCategory(apartmentId: string, formData: FormData) {
    const { error } = await authorize(apartmentId)
    if (error) return { error }

    const parsed = housingCategorySchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        unit: String(formData.get("unit") ?? "EUR"),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
        color: String(formData.get("color") ?? "#64748B").trim(),
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    const { name, unit, icon, color } = parsed.data

    const existing = await prisma.housingCategory.findUnique({
        where: { apartmentId_name: { apartmentId, name } },
    })
    if (existing) return { error: `A category named "${name}" already exists.` }

    const count = await prisma.housingCategory.count({ where: { apartmentId } })
    await prisma.housingCategory.create({
        data: { apartmentId, name, unit, icon: icon || null, color, order: count },
    })
    revalidatePath("/housing")
    revalidatePath("/housing/categories")
    return { success: true }
}

export async function updateHousingCategory(categoryId: string, formData: FormData) {
    const { error, category } = await authorizeCategory(categoryId)
    if (error) return { error }

    const parsed = housingCategorySchema.safeParse({
        name: String(formData.get("name") ?? "").trim(),
        unit: String(formData.get("unit") ?? "EUR"),
        icon: String(formData.get("icon") ?? "").trim() || undefined,
        color: String(formData.get("color") ?? "#64748B").trim(),
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    const { name, unit, icon, color } = parsed.data

    const clash = await prisma.housingCategory.findUnique({
        where: { apartmentId_name: { apartmentId: category.apartmentId, name } },
    })
    if (clash && clash.id !== categoryId) return { error: `A category named "${name}" already exists.` }

    // Switching a metered category to euros leaves stale m³/kWh readings behind,
    // which would reappear if it were ever switched back. Clear them.
    const droppingQuantity = unit === "EUR" && category.unit !== "EUR"

    await prisma.$transaction(async (tx) => {
        await tx.housingCategory.update({
            where: { id: categoryId },
            data: { name, unit, icon: icon || null, color },
        })
        if (droppingQuantity) {
            await tx.housingEntry.updateMany({
                where: { housingCategoryId: categoryId },
                data: { quantity: null },
            })
        }
    })
    revalidatePath("/housing")
    revalidatePath("/housing/categories")
    return { success: true }
}

export async function deleteHousingCategory(categoryId: string) {
    const { error } = await authorizeCategory(categoryId)
    if (error) return { error }

    await prisma.housingCategory.delete({ where: { id: categoryId } })
    revalidatePath("/housing")
    revalidatePath("/housing/categories")
    return { success: true }
}

/** Entries this category would take down with it, for the delete confirmation. */
export async function getHousingCategoryEntries(categoryId: string) {
    const { error } = await authorizeCategory(categoryId)
    if (error) return []

    return prisma.housingEntry.findMany({
        where: { housingCategoryId: categoryId },
        include: { housingMonth: { select: { month: true, year: true } } },
        orderBy: [{ housingMonth: { year: "desc" } }, { housingMonth: { month: "desc" } }],
    })
}

export async function reorderHousingCategories(apartmentId: string, orderedIds: string[]) {
    const { error } = await authorize(apartmentId)
    if (error) return { error }

    const categories = await prisma.housingCategory.findMany({
        where: { id: { in: orderedIds }, apartmentId },
    })
    if (categories.length !== orderedIds.length) return { error: "Unauthorized" }

    await prisma.$transaction(
        orderedIds.map((id, index) =>
            prisma.housingCategory.update({ where: { id }, data: { order: index } })
        )
    )
    revalidatePath("/housing")
    revalidatePath("/housing/categories")
    return { success: true }
}

// ------------------------------------------------------------------ entries

/**
 * Write one category's figures for one month.
 *
 * Upsert rather than create/update: the row for a (month, category) pair may or
 * may not exist yet, and both members can be typing into the same month.
 * Clearing every field deletes the row again, so an empty cell stays empty
 * rather than becoming a stored 0.
 */
export async function saveHousingEntry(formData: FormData) {
    const housingMonthId = String(formData.get("housingMonthId") ?? "")
    const housingCategoryId = String(formData.get("housingCategoryId") ?? "")

    const month = await prisma.housingMonth.findUnique({ where: { id: housingMonthId } })
    if (!month) return { error: "Not found" }

    const { error } = await authorize(month.apartmentId)
    if (error) return { error }

    const category = await prisma.housingCategory.findUnique({ where: { id: housingCategoryId } })
    if (!category || category.apartmentId !== month.apartmentId) return { error: "Invalid category" }

    const amount = parseOptionalAmount(formData.get("amount"))
    const rawQuantity = parseOptionalAmount(formData.get("quantity"))
    // A euro-only category has no quantity field on screen; ignore anything sent.
    const quantity = category.unit === "EUR" ? null : rawQuantity

    if (Number.isNaN(amount)) return { error: "Amount is not a valid number" }
    if (Number.isNaN(quantity)) return { error: "Quantity is not a valid number" }

    const note = String(formData.get("note") ?? "").trim()

    const parsed = housingEntrySchema.safeParse({
        housingMonthId,
        housingCategoryId,
        amount,
        quantity,
        note: note || undefined,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const isEmpty = parsed.data.amount === null && parsed.data.quantity === null && !note
    if (isEmpty) {
        await prisma.housingEntry.deleteMany({ where: { housingMonthId, housingCategoryId } })
        revalidatePath("/housing")
        return { success: true }
    }

    await prisma.housingEntry.upsert({
        where: { housingMonthId_housingCategoryId: { housingMonthId, housingCategoryId } },
        create: {
            housingMonthId,
            housingCategoryId,
            amount: parsed.data.amount,
            quantity: parsed.data.quantity,
            note: note || null,
        },
        update: {
            amount: parsed.data.amount,
            quantity: parsed.data.quantity,
            note: note || null,
        },
    })
    revalidatePath("/housing")
    return { success: true }
}

/** Bring a past month into existence so it can be filled in retrospectively. */
export async function openHousingMonth(apartmentId: string, month: number, year: number) {
    const { error } = await authorize(apartmentId)
    if (error) return { error }

    if (!Number.isInteger(month) || month < 1 || month > 12) return { error: "Invalid month" }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return { error: "Invalid year" }

    await getOrCreateHousingMonth(apartmentId, month, year)
    revalidatePath("/housing")
    return { success: true }
}

export async function deleteHousingMonth(housingMonthId: string) {
    const month = await prisma.housingMonth.findUnique({ where: { id: housingMonthId } })
    if (!month) return { error: "Not found" }

    const { error } = await authorize(month.apartmentId)
    if (error) return { error }

    await prisma.housingMonth.delete({ where: { id: housingMonthId } })
    revalidatePath("/housing")
    return { success: true }
}
