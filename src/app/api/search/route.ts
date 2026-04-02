import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { teamId } = await requireTeamMember()
    const q = request.nextUrl.searchParams.get('q')

    if (!q || q.length < 1) {
      return NextResponse.json({ goals: [], profiles: [] })
    }

    const [goals, profiles] = await Promise.all([
      prisma.goal.findMany({
        where: {
          teamId,
          title: { contains: q, mode: 'insensitive' },
        },
        take: 5,
      }),
      prisma.profile.findMany({
        where: {
          teamId,
          fullName: { contains: q, mode: 'insensitive' },
        },
        take: 5,
      }),
    ])

    return NextResponse.json({ goals, profiles })
  } catch (error) {
    return handleApiError(error)
  }
}
