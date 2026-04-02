import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/forgot-password')

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/gantt', request.url))
        return true
      }

      return isLoggedIn
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.profileId = (user as Record<string, unknown>).profileId as string | undefined
        token.teamId = (user as Record<string, unknown>).teamId as string | undefined
        token.role = (user as Record<string, unknown>).role as string | undefined
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.profileId = token.profileId as string | undefined
      session.user.teamId = token.teamId as string | undefined
      session.user.role = token.role as string | undefined
      return session
    },
  },
} satisfies NextAuthConfig
