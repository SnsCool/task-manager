import { NextResponse } from 'next/server'
import { requireAuth, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await requireAuth()
    const profile = await prisma.profile.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    return NextResponse.json(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
