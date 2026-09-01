import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getCurrentDbUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { getUserApartment } from "@/lib/housing"
import { HousingCategoryManagerContent } from "@/components/housing-category-manager-content"

export const dynamic = "force-dynamic"

export default async function HousingCategoriesPage() {
    const user = await getCurrentDbUser()
    const apartment = await getUserApartment(user.id)
    if (!apartment) redirect("/housing")

    const categories = await prisma.housingCategory.findMany({
        where: { apartmentId: apartment.id },
        orderBy: [
            { order: { sort: "asc", nulls: "last" } },
            { createdAt: "asc" },
        ],
    })

    return (
        <div className="max-w-lg mx-auto py-8 space-y-4">
            <Link href="/housing"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="size-3.5" />
                Back to housing costs
            </Link>
            <div>
                <h1 className="text-3xl font-semibold">Cost Categories</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Shared with everyone in {apartment.name}.
                </p>
            </div>
            <HousingCategoryManagerContent apartmentId={apartment.id} categories={categories} />
        </div>
    )
}
