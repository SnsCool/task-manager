import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { teamId } = await requireTeamMember()
    const goals = await prisma.goal.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(goals)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, teamId } = await requireTeamMember()
    const body = await request.json()

    let path = ''
    let depth = 0
    let goalType = body.goal_type || 'task'

    if (body.parent_id) {
      const parent = await prisma.goal.findUnique({ where: { id: body.parent_id } })
      if (parent) {
        path = parent.path ? `${parent.path}.${parent.id}` : parent.id
        depth = parent.depth + 1

        // 構造強制: 親のgoal_typeに基づいて子のgoal_typeを自動決定
        const childTypeMap: Record<string, string> = {
          kgi: 'kpi',
          kpi: 'issue',
          issue: 'task',
        }
        const expectedType = childTypeMap[parent.goalType]
        if (expectedType) {
          goalType = expectedType
        }

        // バリデーション: task の下には子を作れない
        if (parent.goalType === 'task') {
          return NextResponse.json(
            { error: 'タスクの下にはサブ要素を作成できません' },
            { status: 400 }
          )
        }
      }
    }

    const goal = await prisma.goal.create({
      data: {
        teamId,
        parentId: body.parent_id || null,
        title: body.title,
        description: body.description || null,
        status: body.status || 'not_started',
        priority: body.priority || 'medium',
        startDate: body.start_date ? new Date(body.start_date) : null,
        dueDate: body.due_date ? new Date(body.due_date) : null,
        completionCriteria: body.completion_criteria || null,
        progress: body.progress || 0,
        createdBy: profile.id,
        path,
        depth,
        goalType,
        metricName: body.metric_name || null,
        metricUnit: body.metric_unit || null,
        metricTarget: body.metric_target != null ? parseFloat(body.metric_target) : null,
        periodType: body.period_type || null,
        periodStart: body.period_start ? new Date(body.period_start) : null,
        periodEnd: body.period_end ? new Date(body.period_end) : null,
      },
    })

    await prisma.goalActivity.create({
      data: {
        goalId: goal.id,
        profileId: profile.id,
        action: 'created',
        details: { title: goal.title },
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
