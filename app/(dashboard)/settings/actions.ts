"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const name = String(formData.get("name") ?? "").trim()
  const image = String(formData.get("image") ?? "").trim()

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || null,
      image: image || null,
    },
    select: {
      name: true,
      image: true,
    },
  })

  revalidatePath("/")
  revalidatePath("/settings")

  return { success: true, user }
}
