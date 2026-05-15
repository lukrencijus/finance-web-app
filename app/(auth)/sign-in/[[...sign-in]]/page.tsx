"use client"
import { loginUser } from "../actions"
import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { loginWithGoogle } from "../actions"
import Image from 'next/image'

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const oauthError = searchParams.get("error")

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await loginUser(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      <div className="h-full lg:flex flex-col items-center justify-center px-4">
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 space-y-6 w-full max-w-md">
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">Sign In</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your account details</p>
          </div>

          {registered && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
              Account created! Please sign in.
            </div>
          )}

          {oauthError === "OAuthAccountNotLinked" && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
              This email is already associated with an account. Please sign in with your email and password.
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-card-foreground">Email</label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-muted-foreground"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-card-foreground">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-muted-foreground"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-2">or</span>
            </div>
          </div>

          <form action={loginWithGoogle}>
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-2 text-sm text-card-foreground hover:bg-accent transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Log in with Google
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Do not have an account?{" "}
            <Link href="/sign-up" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className="relative h-full bg-blue-600 hidden lg:flex items-center justify-center">
        <h1 className="absolute top-100 left-1/2 -translate-x-1/2 text-white text-2xl font-bold">Money Tracker</h1>
        <Image src="/logo.png" alt="Logo" width={681} height={681} className="h-30 w-auto animate-pulse" loading="eager" />
      </div>
    </div>
  )
}