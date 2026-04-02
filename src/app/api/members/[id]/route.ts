import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { teamId } = await requireTeamMember()
    const { id } = await params
    const body = await request.json()

    const member = await prisma.profile.findFirst({ where: { id, teamId } })
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: { managerId: body.manager_id ?? null },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
