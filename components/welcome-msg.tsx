"use client"
import { useSession } from "next-auth/react"

export const WelcomeMsg = () => {
  const { data: session, status } = useSession()
  return (
    <div className="space-y-2 mb-4">
      <h2 className="text-2xl lg:text-4xl text-white font-medium">
        Welcome Back{status === "authenticated" ? ", " : " "}
        {session?.user?.name?.split(" ")[0]} 🤝
      </h2>
      <p className="text-sm lg:text-base text-gray-300">
        This is your Financial Overview
      </p>
    </div>
  )
}