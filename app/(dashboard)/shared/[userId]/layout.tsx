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
            <div className="fixed top-4 lg:top-auto lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-2xl">
                <div className="bg-card/80 backdrop-blur-2xl border border-primary/20 px-4 py-2 rounded-2xl flex items-center justify-between shadow-2xl shadow-primary/10">
                    
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-primary/10 p-1.5 rounded-xl shrink-0">
                            {isReadOnly
                                ? <Eye className="size-4 text-primary" />
                                : <Pencil className="size-4 text-primary" />
                            }
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap overflow-hidden">
                            <span className="text-foreground font-semibold truncate max-w-[120px] xs:max-w-none">
                                Viewing <span className="text-primary">{ownerName}</span>
                            </span>
                            <span className="opacity-60 font-medium uppercase text-[10px] shrink-0">
                                • {isReadOnly ? "Read Only" : "Edit Mode"}
                            </span>
                        </div>
                    </div>
                    
                    <Link 
                        href="/" 
                        className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 shrink-0 ml-2"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Back to my profile</span>
                    </Link>
                </div>
            </div>
            
            {/* Content Container */}
            <div className="pt-20 lg:pt-0 lg:pb-24"> 
                {children}
            </div>
        </>
    )
}
