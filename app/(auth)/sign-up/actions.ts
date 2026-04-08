"use server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "Šis el. paštas jau užregistruotas" }

  const hashed = await bcrypt.hash(password, 12)
  const count = await prisma.user.count()

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: count === 0 ? "ADMIN" : "USER",
      status: count === 0 ? "ACTIVE" : "PENDING",
    },
  })

  redirect("/sign-in")
}