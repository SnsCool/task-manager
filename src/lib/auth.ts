import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { profile: { include: { team: true } } },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        )
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.fullName ?? '',
          profileId: user.profile?.id,
          teamId: user.profile?.teamId,
          role: user.profile?.role,
        }
      },
    }),
  ],
})

declare module 'next-auth' {
  interface User {
    profileId?: string
    teamId?: string | null
    role?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      profileId?: string
      teamId?: string | null
      role?: string
    }
  }
}
