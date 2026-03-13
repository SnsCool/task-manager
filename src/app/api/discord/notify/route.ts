import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STATUS_COLORS: Record<string, number> = {
  not_started: 0x9ca3af, // gray
  in_progress: 0x3b82f6, // blue
  completed: 0x22c55e,   // green
  on_hold: 0xeab308,     // yellow
}

const STATUS_LABELS: Record<string, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
  on_hold: '保留',
}

const EVENT_TITLES: Record<string, string> = {
  created: 'タスク作成',
  status_changed: 'ステータス変更',
  completed: 'タスク完了',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { team_id, event, goal, old_status, user_name } = body

    if (!team_id || !event || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch webhook URL from integrations table
    const supabase = await createClient()
    const { data: integration } = await supabase
      .from('integrations')
      .select('config')
      .eq('team_id', team_id)
      .eq('service_name', 'discord')
      .eq('is_connected', true)
      .single()

    if (!integration?.config || !(integration.config as Record<string, string>).webhook_url) {
      // No Discord integration configured; silently skip
      return NextResponse.json({ skipped: true })
    }

    const webhookUrl = (integration.config as Record<string, string>).webhook_url

    // Build embed
    const fields = []

    fields.push({
      name: 'ステータス',
      value: STATUS_LABELS[goal.status] || goal.status,
      inline: true,
    })

    if (goal.priority) {
      const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高' }
      fields.push({
        name: '優先度',
        value: priorityLabels[goal.priority] || goal.priority,
        inline: true,
      })
    }

    if (goal.start_date) {
      fields.push({ name: '開始日', value: goal.start_date, inline: true })
    }

    if (goal.due_date) {
      fields.push({ name: '期日', value: goal.due_date, inline: true })
    }

    if (event === 'status_changed' && old_status) {
      fields.push({
        name: '変更',
        value: `${STATUS_LABELS[old_status] || old_status} → ${STATUS_LABELS[goal.status] || goal.status}`,
        inline: false,
      })
    }

    const embed = {
      title: `${EVENT_TITLES[event] || event}: ${goal.title}`,
      color: STATUS_COLORS[goal.status] || 0x6b7280,
      fields,
      footer: {
        text: `by ${user_name || 'Unknown'}`,
      },
      timestamp: new Date().toISOString(),
    }

    // Send to Discord
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!discordRes.ok) {
      const text = await discordRes.text()
      return NextResponse.json({ error: 'Discord API error', details: text }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Discord notify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
