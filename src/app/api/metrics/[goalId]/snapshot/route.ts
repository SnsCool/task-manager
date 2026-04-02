import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { profile } = await requireTeamMember()
    const { goalId } = await params
    const body = await request.json()

    // Verify the goal exists and is a KPI
    const goal = await prisma.goal.findUnique({ where: { id: goalId } })
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    if (goal.goalType !== 'kpi' && goal.goalType !== 'kgi') {
      return NextResponse.json({ error: 'Metrics can only be recorded for KGI/KPI goals' }, { status: 400 })
    }

    const snapshot = await prisma.metricSnapshot.create({
      data: {
        goalId,
        value: body.value,
        source: body.source || 'manual',
        recordedBy: profile.id,
        note: body.note || null,
      },
    })

    // Update the goal's current metric value
    await prisma.goal.update({
      where: { id: goalId },
      data: { metricCurrent: body.value },
    })

    return NextResponse.json(snapshot, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
