"use server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"
import { registerSchema } from "@/lib/validations"

export async function registerUser(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()

  const parsed = registerSchema.safeParse({
    name: name || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "This email is already registered" }

  const hashed = await bcrypt.hash(password, 12)
  const count = await prisma.user.count()

  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name || null,
      password: hashed,
      role: count === 0 ? "ADMIN" : "USER",
      status: count === 0 ? "ACTIVE" : "PENDING",
    },
  })

  redirect("/sign-in?registered=true")
}

export async function loginWithGoogle() {
  "use server"
  await signIn("google", { redirectTo: "/" })
}