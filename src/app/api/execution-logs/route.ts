import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { teamId } = await requireTeamMember()
    const taskId = request.nextUrl.searchParams.get('task_id')
    const profileId = request.nextUrl.searchParams.get('profile_id')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { teamId }
    if (taskId) where.taskId = taskId
    if (profileId) where.profileId = profileId

    const logs = await prisma.executionLog.findMany({
      where,
      include: {
        profile: true,
        task: true,
        relatedGoal: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, teamId } = await requireTeamMember()
    const body = await request.json()

    const log = await prisma.executionLog.create({
      data: {
        taskId: body.task_id || null,
        profileId: profile.id,
        teamId,
        logType: body.log_type || 'note',
        content: body.content,
        source: body.source || 'manual',
        sourceId: body.source_id || null,
        sourceUrl: body.source_url || null,
        relatedGoalId: body.related_goal_id || null,
        metricImpact: body.metric_impact || null,
      },
      include: {
        profile: true,
        task: true,
        relatedGoal: true,
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
