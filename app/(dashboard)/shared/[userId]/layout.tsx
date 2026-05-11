import { getCurrentDbUser } from "@/lib/current-user"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Eye, Pencil, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SharedLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ userId: string }>
}) {
    const { userId: targetUserId } = await params
    const currentUser = await getCurrentDbUser()

    const access = await prisma.sharedAccess.findUnique({
        where: {
            ownerId_sharedWithId: {
                ownerId: targetUserId,
                sharedWithId: currentUser.id,
            },
        },
        include: {
            owner: { select: { name: true, email: true } },
        },
    })

    if (!access) redirect("/")

    const ownerName = access.owner.name ?? access.owner.email
    const isReadOnly = access.permission === "VIEW"

    return (
        <>
            {children}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-4 py-2.5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2 text-sm text-foreground">
                    {isReadOnly
                        ? <Eye className="size-4 text-muted-foreground shrink-0" />
                        : <Pencil className="size-4 text-muted-foreground shrink-0" />
                    }
                    <span>
                        Viewing <span className="font-medium">{ownerName}</span> profile
                        {" "}
                        <span className="text-muted-foreground">({isReadOnly ? "read-only mode" : "edit mode"})</span>
                    </span>
                </div>
                <Link href="/" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-3.5" />
                    Back to my profile
                </Link>
            </div>
        </>
    )
}