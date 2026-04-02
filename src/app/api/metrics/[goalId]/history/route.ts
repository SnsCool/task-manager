import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    await requireTeamMember()
    const { goalId } = await params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30')

    const snapshots = await prisma.metricSnapshot.findMany({
      where: { goalId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(snapshots)
  } catch (error) {
    return handleApiError(error)
  }
}
