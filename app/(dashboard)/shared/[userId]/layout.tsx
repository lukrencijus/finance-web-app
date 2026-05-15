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
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl">
                <div className="bg-primary/5 backdrop-blur-md border border-primary/20 px-6 py-3 rounded-xl flex items-center justify-between shadow-2xl shadow-primary/20">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="bg-primary/10 p-1.5 rounded-xl">
                            {isReadOnly
                                ? <Eye className="size-4 text-primary shrink-0" />
                                : <Pencil className="size-4 text-primary shrink-0" />
                            }
                        </div>
                        <span className="text-foreground font-medium">
                            Viewing <span className="text-primary font-bold">{ownerName}</span> profile
                            <span className="ml-2 opacity-70 font-normal text-xs uppercase tracking-wider">
                                • {isReadOnly ? "Read Only" : "Edit Mode"}
                            </span>
                        </span>
                    </div>
                    <Link 
                        href="/" 
                        className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-xl hover:opacity-90 transition-all active:scale-95"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to my profile
                    </Link>
                </div>
            </div>
        </>
    )
}