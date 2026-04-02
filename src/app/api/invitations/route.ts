import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { teamId } = await requireTeamMember()
    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(invitations)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, teamId } = await requireTeamMember()
    const { email, role } = await request.json()

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        role: role || 'member',
        invitedBy: profile.id,
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
