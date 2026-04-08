import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export async function getCurrentDbUser() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) redirect("/sign-in")

  return user
}

export async function getCurrentAdminUser() {
  const user = await getCurrentDbUser()
  if (user.role !== "ADMIN") redirect("/")
  return user
}