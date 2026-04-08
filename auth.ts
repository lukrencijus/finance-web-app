import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-ignore
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.picture = user.image
        token.role = (user as any).role
        token.status = (user as any).status
      }

      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            name: true,
            image: true,
            role: true,
            status: true,
          },
        })

        if (dbUser) {
          token.name = dbUser.name
          token.picture = dbUser.image
          token.role = dbUser.role
          token.status = dbUser.status
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        session.user.role = token.role as string
        session.user.status = token.status as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true

      if (account?.provider === "google") {
        const email = user.email!
        const existing = await prisma.user.findUnique({ where: { email } })

        if (!existing) {
          const count = await prisma.user.count()
          await prisma.user.create({
            data: {
              email,
              name: user.name ?? null,
              image: user.image ?? null,
              role: count === 0 ? "ADMIN" : "USER",
              status: count === 0 ? "ACTIVE" : "PENDING",
            },
          })
        }
        return true
      }
      return false
    },
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const email = (credentials.email as string).trim().toLowerCase()
        const user = await prisma.user.findUnique({ where: { email } })
        
        if (!user || !user.password) return null
        
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        
        return user
      },
    }),
  ],
})