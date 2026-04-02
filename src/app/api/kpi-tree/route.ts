import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { teamId } = await requireTeamMember()
    const goalType = request.nextUrl.searchParams.get('goal_type')

    const where: Record<string, unknown> = { teamId }
    if (goalType) {
      where.goalType = goalType
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        assignees: {
          include: { profile: true },
        },
      },
      orderBy: [{ depth: 'asc' }, { createdAt: 'asc' }],
    })

    // Build tree structure
    const goalMap = new Map<string, typeof goals[0] & { children: typeof goals }>()
    const roots: (typeof goals[0] & { children: typeof goals })[] = []

    for (const goal of goals) {
      goalMap.set(goal.id, { ...goal, children: [] })
    }

    for (const goal of goals) {
      const node = goalMap.get(goal.id)!
      if (goal.parentId && goalMap.has(goal.parentId)) {
        goalMap.get(goal.parentId)!.children.push(node)
      } else if (!goal.parentId) {
        roots.push(node)
      }
    }

    return NextResponse.json(roots)
  } catch (error) {
    return handleApiError(error)
  }
}
