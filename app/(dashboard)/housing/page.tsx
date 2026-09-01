import { getCurrentDbUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { getUserApartment, getPendingInvitesFor, getOrCreateHousingMonth } from "@/lib/housing"
import { HousingClient } from "./housing-client"
import { ApartmentOnboarding } from "./apartment-onboarding"

export const dynamic = "force-dynamic"

type Props = {
    searchParams: Promise<{ month?: string; year?: string }>
}

export default async function HousingPage({ searchParams }: Props) {
    const user = await getCurrentDbUser()
    const apartment = await getUserApartment(user.id)

    // No apartment yet: either create one or accept an invite to somebody's.
    if (!apartment) {
        const invites = await getPendingInvitesFor(user.email)
        return <ApartmentOnboarding invites={invites} />
    }

    const { month: monthParam, year: yearParam } = await searchParams

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    let month = monthParam ? parseInt(monthParam) : currentMonth
    let year = yearParam ? parseInt(yearParam) : currentYear
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        month = currentMonth
        year = currentYear
    }

    const isCurrentMonth = month === currentMonth && year === currentYear

    const [housingMonth, categories, allMonths] = await Promise.all([
        // The current month is created on sight, the way monthly sheets are.
        // Any other month has to be opened deliberately, so browsing back
        // through the picker doesn't litter the history with empty months.
        isCurrentMonth
            ? getOrCreateHousingMonth(apartment.id, month, year)
            : prisma.housingMonth.findUnique({
                where: { apartmentId_month_year: { apartmentId: apartment.id, month, year } },
                include: { entries: true },
            }),
        prisma.housingCategory.findMany({
            where: { apartmentId: apartment.id },
            orderBy: [
                { order: { sort: "asc", nulls: "last" } },
                { createdAt: "asc" },
            ],
        }),
        prisma.housingMonth.findMany({
            where: { apartmentId: apartment.id },
            orderBy: [{ year: "desc" }, { month: "desc" }],
            select: {
                id: true,
                month: true,
                year: true,
                entries: { select: { amount: true } },
            },
        }),
    ])

    const history = allMonths.map(m => ({
        id: m.id,
        month: m.month,
        year: m.year,
        total: m.entries.reduce((sum, e) => sum + (e.amount ?? 0), 0),
        filled: m.entries.length,
    }))

    return (
        <HousingClient
            apartment={{
                id: apartment.id,
                name: apartment.name,
                myRole: apartment.myRole,
                members: apartment.members.map(m => ({
                    id: m.id,
                    role: m.role,
                    userId: m.userId,
                    name: m.user.name,
                    email: m.user.email,
                })),
                invites: apartment.invites.map(i => ({ id: i.id, email: i.email })),
            }}
            categories={categories}
            housingMonth={housingMonth}
            history={history}
            month={month}
            year={year}
            isCurrentMonth={isCurrentMonth}
            currentUserId={user.id}
        />
    )
}
