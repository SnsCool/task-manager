import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { name } = await request.json()

    const profile = await prisma.profile.findFirst({
      where: { userId: session.user.id },
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({ data: { name } })
      await tx.profile.update({
        where: { id: profile.id },
        data: { teamId: newTeam.id, role: 'admin' },
      })
      return newTeam
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { teamId } = await requireTeamMember()
    const body = await request.json()

    const team = await prisma.team.update({
      where: { id: teamId },
      data: { name: body.name },
    })

    return NextResponse.json(team)
  } catch (error) {
    return handleApiError(error)
  }
}
