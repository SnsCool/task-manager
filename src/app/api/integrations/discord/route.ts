import { NextRequest, NextResponse } from 'next/server'
import { requireTeamMember, handleApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { teamId } = await requireTeamMember()
    const integration = await prisma.integration.findFirst({
      where: { teamId, serviceName: 'discord' },
    })
    return NextResponse.json(integration)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { teamId } = await requireTeamMember()
    const { webhook_url, is_connected } = await request.json()

    const existing = await prisma.integration.findFirst({
      where: { teamId, serviceName: 'discord' },
    })

    if (existing) {
      const updated = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          isConnected: is_connected ?? existing.isConnected,
          config: { webhook_url },
        },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.integration.create({
      data: {
        teamId,
        serviceName: 'discord',
        isConnected: is_connected ?? false,
        config: { webhook_url },
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
