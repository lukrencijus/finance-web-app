import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith("/sign-in") ||
                     pathname.startsWith("/sign-up")
  const isPending = pathname.startsWith("/pending")
  const isApi = pathname.startsWith("/api")

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  if (!isLoggedIn && !isAuthPage && !isApi) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}