import { NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { teamId } = await requireTeamMember()
    const members = await prisma.profile.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(members)
  } catch (error) {
    return handleApiError(error)
  }
}
