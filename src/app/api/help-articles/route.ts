import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const articles = await prisma.helpArticle.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(articles)
  } catch (error) {
    console.error('Help articles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
