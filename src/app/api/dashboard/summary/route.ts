import { NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { teamId } = await requireTeamMember()

    // Get all KPIs for the team
    const kpis = await prisma.goal.findMany({
      where: { teamId, goalType: 'kpi' },
      include: {
        children: {
          include: {
            children: true, // tasks under issues
          },
        },
      },
    })

    const kgis = await prisma.goal.findMany({
      where: { teamId, goalType: 'kgi' },
    })

    // Calculate summary
    let achieved = 0
    let notAchieved = 0
    let noData = 0
    const alertKpis: typeof kpis = []

    for (const kpi of kpis) {
      if (kpi.metricTarget == null || kpi.metricCurrent == null) {
        noData++
      } else if (kpi.metricCurrent >= kpi.metricTarget) {
        achieved++
      } else {
        notAchieved++
        alertKpis.push(kpi)
      }
    }

    // Recent metric snapshots for trending
    const recentSnapshots = await prisma.metricSnapshot.findMany({
      where: {
        goal: { teamId, goalType: 'kpi' },
      },
      orderBy: { recordedAt: 'desc' },
      take: 50,
      include: { goal: true },
    })

    // Task completion stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const taskStats = await prisma.dailyTask.aggregate({
      where: { teamId },
      _count: { id: true },
    })
    const completedTasks = await prisma.dailyTask.aggregate({
      where: { teamId, isCompleted: true },
      _count: { id: true },
    })

    return NextResponse.json({
      kpiSummary: {
        total: kpis.length,
        achieved,
        notAchieved,
        noData,
      },
      kgiCount: kgis.length,
      alertKpis: alertKpis.map((kpi) => ({
        id: kpi.id,
        title: kpi.title,
        metricName: kpi.metricName,
        metricUnit: kpi.metricUnit,
        metricTarget: kpi.metricTarget,
        metricCurrent: kpi.metricCurrent,
        progress: kpi.progress,
        issueCount: kpi.children.length,
        taskCount: kpi.children.reduce((sum, issue) => sum + issue.children.length, 0),
      })),
      recentSnapshots,
      taskStats: {
        total: taskStats._count.id,
        completed: completedTasks._count.id,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
