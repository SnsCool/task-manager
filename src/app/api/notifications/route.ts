import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { profile } = await requireTeamMember()
    const notifications = await prisma.notification.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(notifications)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { profile } = await requireTeamMember()
    const body = await request.json()

    if (body.mark_all_read) {
      await prisma.notification.updateMany({
        where: { profileId: profile.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
