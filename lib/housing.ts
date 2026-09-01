import { prisma } from "@/lib/prisma"
import type { HousingUnit } from "@/lib/housing-units"

export * from "@/lib/housing-units"

/**
 * Seeded into every new apartment so the first month is fillable immediately.
 * Mirrors the spreadsheet this feature replaces; all of it is editable after.
 */
const DEFAULT_CATEGORIES: { name: string; unit: HousingUnit; icon: string; color: string }[] = [
    { name: "Rent", unit: "EUR", icon: "🏠", color: "#3B82F6" },
    { name: "Parking", unit: "EUR", icon: "🅿️", color: "#6366F1" },
    { name: "Cold water", unit: "M3", icon: "🚿", color: "#06B6D4" },
    { name: "Hot water", unit: "M3", icon: "♨️", color: "#EF4444" },
    { name: "Heating", unit: "EUR", icon: "🔥", color: "#F97316" },
    { name: "Electricity", unit: "KWH", icon: "⚡", color: "#F59E0B" },
    { name: "Waste", unit: "EUR", icon: "🗑️", color: "#22C55E" },
    { name: "Gas", unit: "EUR", icon: "🔵", color: "#A855F7" },
    { name: "Building fee", unit: "EUR", icon: "🏢", color: "#64748B" },
]

/**
 * The apartment this user belongs to, or null.
 *
 * The schema allows several memberships (moving house, a second flat) but the
 * UI deliberately surfaces one, so this returns the oldest membership.
 */
export async function getUserApartment(userId: string) {
    const membership = await prisma.apartmentMember.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: {
            apartment: {
                include: {
                    members: {
                        include: { user: { select: { id: true, name: true, email: true } } },
                        orderBy: { createdAt: "asc" },
                    },
                    invites: {
                        where: { status: "PENDING" },
                        orderBy: { createdAt: "asc" },
                    },
                },
            },
        },
    })
    if (!membership) return null
    return { ...membership.apartment, myRole: membership.role }
}

/**
 * Membership is the authorization check for every housing mutation - there is
 * no owner/guest split the way SharedAccess has one. Returns the member row so
 * callers can additionally require OWNER for invites.
 */
export async function getMembership(apartmentId: string, userId: string) {
    return prisma.apartmentMember.findUnique({
        where: { apartmentId_userId: { apartmentId, userId } },
    })
}

/** Invites addressed to this user's email that are still waiting on an answer. */
export async function getPendingInvitesFor(email: string) {
    return prisma.apartmentInvite.findMany({
        where: { email: email.toLowerCase(), status: "PENDING" },
        include: {
            apartment: { select: { id: true, name: true } },
            invitedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
    })
}

export async function createApartment(userId: string, name: string) {
    return prisma.$transaction(async (tx) => {
        const apartment = await tx.apartment.create({
            data: {
                name,
                members: { create: { userId, role: "OWNER" } },
                categories: {
                    create: DEFAULT_CATEGORIES.map((c, index) => ({ ...c, order: index })),
                },
            },
        })
        return apartment
    })
}

/**
 * The apartment's row for one month, created on first view.
 *
 * Mirrors getCurrentMonthSheet(): opening a month is what brings it into
 * existence, so there is no "create month" button to forget about. Nothing is
 * copied forward - last month's bills are not this month's.
 */
export async function getOrCreateHousingMonth(apartmentId: string, month: number, year: number) {
    const existing = await prisma.housingMonth.findUnique({
        where: { apartmentId_month_year: { apartmentId, month, year } },
        include: { entries: true },
    })
    if (existing) return existing

    try {
        return await prisma.housingMonth.create({
            data: { apartmentId, month, year },
            include: { entries: true },
        })
    } catch {
        // Both members opening the same month at once: one create loses the
        // unique constraint race, so read back what the winner wrote.
        return prisma.housingMonth.findUniqueOrThrow({
            where: { apartmentId_month_year: { apartmentId, month, year } },
            include: { entries: true },
        })
    }
}

/** Euro total of a month - quantities never take part. */
export function monthTotal(entries: { amount: number | null }[]): number {
    return entries.reduce((sum, e) => sum + (e.amount ?? 0), 0)
}
