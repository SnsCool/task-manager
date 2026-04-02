import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { teamId } = await requireTeamMember()
    const { id } = await params

    const goal = await prisma.goal.findFirst({
      where: { id, teamId },
      include: {
        assignees: { include: { profile: true } },
        comments: {
          include: { profile: true },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: { profile: true },
          orderBy: { createdAt: 'desc' },
        },
        children: true,
      },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    return NextResponse.json(goal)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, teamId } = await requireTeamMember()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.goal.findFirst({ where: { id, teamId } })
    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.progress !== undefined) updateData.progress = body.progress
    if (body.start_date !== undefined) updateData.startDate = body.start_date ? new Date(body.start_date) : null
    if (body.due_date !== undefined) updateData.dueDate = body.due_date ? new Date(body.due_date) : null
    if (body.completion_criteria !== undefined) updateData.completionCriteria = body.completion_criteria

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    })

    if (body.status !== undefined && body.status !== existing.status) {
      await prisma.goalActivity.create({
        data: {
          goalId: id,
          profileId: profile.id,
          action: 'status_changed',
          details: { from: existing.status, to: body.status },
        },
      })
    } else if (Object.keys(updateData).length > 0) {
      await prisma.goalActivity.create({
        data: {
          goalId: id,
          profileId: profile.id,
          action: 'updated',
          details: { fields: Object.keys(updateData) },
        },
      })
    }

    return NextResponse.json(goal)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { teamId } = await requireTeamMember()
    const { id } = await params

    const existing = await prisma.goal.findFirst({ where: { id, teamId } })
    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.goal.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
