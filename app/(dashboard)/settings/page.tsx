"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { updateProfile } from "./actions"

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, update } = useSession()

  const [name, setName] = useState("")
  const [image, setImage] = useState("")

  useEffect(() => {
    setName(session?.user?.name ?? "")
    setImage(session?.user?.image ?? "")
  }, [session])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    if (result.success) {
      await update({
        name: result.user.name,
        image: result.user.image,
      })

      router.refresh()
    }
  }

  return (
    <div className="max-w-md p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Image URL</label>
          <input
            name="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full p-2 border rounded text-black"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
