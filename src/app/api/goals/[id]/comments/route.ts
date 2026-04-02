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
    const { content } = await request.json()

    const goal = await prisma.goal.findFirst({ where: { id, teamId } })
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const comment = await prisma.goalComment.create({
      data: {
        goalId: id,
        profileId: profile.id,
        content,
      },
      include: { profile: true },
    })

    await prisma.goalActivity.create({
      data: {
        goalId: id,
        profileId: profile.id,
        action: 'comment_added',
        details: { comment_id: comment.id },
      },
    })

    const assignees = await prisma.goalAssignee.findMany({
      where: { goalId: id, profileId: { not: profile.id } },
    })

    if (assignees.length > 0) {
      await prisma.notification.createMany({
        data: assignees.map((a) => ({
          teamId,
          profileId: a.profileId,
          type: 'comment_added' as const,
          title: 'コメントが追加されました',
          message: `「${goal.title}」にコメントが追加されました`,
          relatedGoalId: id,
          relatedProfileId: profile.id,
        })),
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
