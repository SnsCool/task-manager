import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireTeamMember()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.dailyTask.findFirst({
      where: { id, profileId: profile.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.is_completed !== undefined) updateData.isCompleted = body.is_completed
    if (body.title !== undefined) updateData.title = body.title
    if (body.sort_order !== undefined) updateData.sortOrder = body.sort_order

    const task = await prisma.dailyTask.update({
      where: { id },
      data: updateData,
      include: { goal: true },
    })

    return NextResponse.json(task)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireTeamMember()
    const { id } = await params

    const existing = await prisma.dailyTask.findFirst({
      where: { id, profileId: profile.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.dailyTask.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
