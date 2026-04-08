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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Account Pending</h1>
            <p className="mt-2 text-sm text-gray-500">
              Your account has been registered. The administrator will review it and approve it soon.
            </p>
          </div>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/sign-in" })
          }}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 underline">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}