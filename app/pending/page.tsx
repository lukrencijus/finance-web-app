import { auth } from "@/auth"
import { signOut } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function PendingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.status === "ACTIVE") redirect("/")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto border border-yellow-500/20">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-card-foreground tracking-tight">Account Pending</h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account has been registered. The administrator will review and approve it soon.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/sign-in" })
            }}>
              <button type="submit" className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}