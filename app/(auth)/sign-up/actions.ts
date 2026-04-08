"use server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function registerUser(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const name = (formData.get("name") as string)?.trim()

  // Validacija
  if (!email || !password) return { error: "All fields are required" }
  if (password.length < 8) return { error: "Password must be at least 8 characters" }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Invalid email format" }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "This email is already registered" }

  const hashed = await bcrypt.hash(password, 12)
  const count = await prisma.user.count()

  await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashed,
      role: count === 0 ? "ADMIN" : "USER",
      status: count === 0 ? "ACTIVE" : "PENDING",
    },
  })

  redirect("/sign-in?registered=true")
}