import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { webhook_url } = await request.json()

    if (!webhook_url) {
      return NextResponse.json({ error: 'webhook_url is required' }, { status: 400 })
    }

    const embed = {
      title: 'テスト通知',
      description: 'TaskManagerからのDiscord連携テストです。この通知が表示されていれば、設定は正しく完了しています。',
      color: 0x3b82f6,
      footer: { text: 'TaskManager' },
      timestamp: new Date().toISOString(),
    }

    const res = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Discord API error', details: text }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Discord test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
