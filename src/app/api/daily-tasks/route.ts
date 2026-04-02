import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { profile } = await requireTeamMember()
    const date = request.nextUrl.searchParams.get('date')

    const where: Record<string, unknown> = { profileId: profile.id }
    if (date) {
      where.dueDate = new Date(date)
    }

    const tasks = await prisma.dailyTask.findMany({
      where,
      include: { goal: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, teamId } = await requireTeamMember()
    const body = await request.json()

    const task = await prisma.dailyTask.create({
      data: {
        teamId,
        profileId: profile.id,
        title: body.title,
        goalId: body.goal_id || null,
        dueDate: body.due_date ? new Date(body.due_date) : new Date(),
        sortOrder: body.sort_order || 0,
      },
      include: { goal: true },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
