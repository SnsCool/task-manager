import { auth } from './auth'
import { prisma } from './prisma'
import { NextResponse } from 'next/server'

export async function getSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new AuthError('Unauthorized', 401)
  }
  return session
}

export async function requireProfile() {
  const session = await requireAuth()
  const profile = await prisma.profile.findFirst({
    where: { userId: session.user.id },
    include: { team: true },
  })
  if (!profile) {
    throw new AuthError('Profile not found', 404)
  }
  return { session, profile }
}

export async function requireTeamMember() {
  const { session, profile } = await requireProfile()
  if (!profile.teamId) {
    throw new AuthError('No team assigned', 403)
  }
  return { session, profile, teamId: profile.teamId }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('API Error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
