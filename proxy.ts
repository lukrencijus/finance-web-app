import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isAuthPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")

  const isPending = pathname.startsWith("/pending")
  const isApi = pathname.startsWith("/api")

  const isPublicFile =
    pathname.startsWith("/logo.png") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.match(/\.(.*)$/) !== null

  if (isPublicFile) {
    return NextResponse.next()
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (!isLoggedIn && !isAuthPage && !isApi && !isPending) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
