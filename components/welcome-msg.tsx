import { auth } from "@/auth"

export const WelcomeMsg = async () => {
  const session = await auth()

  return (
    <div className="space-y-2 mb-4">
      <h2 className="text-2xl lg:text-4xl text-white font-medium">
        Welcome Back{session?.user?.name ? ", " : " "}
        {session?.user?.name?.split(" ")[0]} 🤝
      </h2>
      <p className="text-sm lg:text-base text-gray-300">
        This is your Financial Overview
      </p>
    </div>
  )
}