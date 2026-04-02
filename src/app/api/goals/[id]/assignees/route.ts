import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, teamId } = await requireTeamMember()
    const { id } = await params
    const { profile_id } = await request.json()

    const goal = await prisma.goal.findFirst({ where: { id, teamId } })
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const assignee = await prisma.goalAssignee.create({
      data: {
        goalId: id,
        profileId: profile_id,
        assignedBy: profile.id,
      },
      include: { profile: true },
    })

    await prisma.goalActivity.create({
      data: {
        goalId: id,
        profileId: profile.id,
        action: 'assignee_added',
        details: { assignee_id: profile_id },
      },
    })

    if (profile_id !== profile.id) {
      await prisma.notification.create({
        data: {
          teamId,
          profileId: profile_id,
          type: 'goal_assigned',
          title: 'ゴールに割り当てられました',
          message: `「${goal.title}」に割り当てられました`,
          relatedGoalId: id,
          relatedProfileId: profile.id,
        },
      })
    }

    return NextResponse.json(assignee, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, teamId } = await requireTeamMember()
    const { id } = await params
    const { assignee_id } = await request.json()

    const goal = await prisma.goal.findFirst({ where: { id, teamId } })
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.goalAssignee.delete({ where: { id: assignee_id } })

    await prisma.goalActivity.create({
      data: {
        goalId: id,
        profileId: profile.id,
        action: 'assignee_removed',
        details: { assignee_id },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
