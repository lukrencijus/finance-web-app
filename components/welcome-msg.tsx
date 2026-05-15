import { auth } from "@/auth"

export const WelcomeMsg = async () => {
  const session = await auth()

  return (
    <div className="space-y-1">
      <h2 className="text-xl lg:text-3xl text-white font-semibold tracking-tight">
        Welcome Back{session?.user?.name ? ", " : " "}
        {session?.user?.name?.split(" ")[0]}
      </h2>
      <p className="text-xs lg:text-sm text-white/70 font-medium">
        This is your Financial Overview
      </p>
    </div>
  )
}