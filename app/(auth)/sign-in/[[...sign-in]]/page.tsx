"use client"
import { loginUser } from "../actions"
import { useState } from "react"

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const result = await loginUser(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <form action={handleSubmit} className="space-y-4">
          <input name="email" type="email" placeholder="Email"
            className="w-full border rounded-md px-3 py-2" required />
          <input name="password" type="password" placeholder="Password"
            className="w-full border rounded-md px-3 py-2" required />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}