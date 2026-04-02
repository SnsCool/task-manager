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
    if (body.parent_id) {
      const parent = await prisma.goal.findUnique({ where: { id: body.parent_id } })
      if (parent) {
        path = parent.path ? `${parent.path}.${parent.id}` : parent.id
        depth = parent.depth + 1
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
