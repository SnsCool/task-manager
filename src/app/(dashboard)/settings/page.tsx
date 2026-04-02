'use client'

import { useEffect, useState } from 'react'
import { Save, Building2, Link, Slack, Calendar, Mail, MessageSquare } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { Header } from '@/components/layout/Header'
import type { Integration } from '@/types'

const integrationsList = [
  { name: 'Slack', icon: Slack, description: 'チャンネルに通知を送信' },
  { name: 'Google Calendar', icon: Calendar, description: 'ゴールの期日をカレンダーに同期' },
  { name: 'Email', icon: Mail, description: 'メールで通知を受信' },
]

export default function SettingsPage() {
  const { user, team } = useAuthStore()
  const [teamName, setTeamName] = useState(team?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [profileName, setProfileName] = useState(user?.full_name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('')
  const [discordSaving, setDiscordSaving] = useState(false)
  const [discordSaved, setDiscordSaved] = useState(false)
  const [discordTesting, setDiscordTesting] = useState(false)
  const [discordTestResult, setDiscordTestResult] = useState<'success' | 'error' | null>(null)
  const [discordConnected, setDiscordConnected] = useState(false)

  useEffect(() => {
    if (team) setTeamName(team.name)
    if (user) setProfileName(user.full_name)

    // Fetch Discord integration
    if (team) {
      apiFetch<Integration>('/api/integrations/discord')
        .then((data) => {
          if (data) {
            setDiscordWebhookUrl((data.config as Record<string, string>)?.webhook_url || '')
            setDiscordConnected(data.is_connected)
          }
        })
        .catch(() => {
          // No discord integration yet
        })
    }
  }, [team, user])

  const saveTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team || !teamName.trim()) return
    setSaving(true)
    await apiFetch('/api/teams', {
      method: 'PATCH',
      body: JSON.stringify({ name: teamName.trim() }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profileName.trim()) return
    setProfileSaving(true)
    await apiFetch(`/api/members/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ full_name: profileName.trim() }),
    })
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const saveDiscord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team) return
    setDiscordSaving(true)

    await apiFetch('/api/integrations/discord', {
      method: 'PUT',
      body: JSON.stringify({
        webhook_url: discordWebhookUrl,
        is_connected: !!discordWebhookUrl,
      }),
    })

    setDiscordConnected(!!discordWebhookUrl)
    setDiscordSaving(false)
    setDiscordSaved(true)
    setTimeout(() => setDiscordSaved(false), 2000)
  }

  const testDiscord = async () => {
    if (!discordWebhookUrl) return
    setDiscordTesting(true)
    setDiscordTestResult(null)
    try {
      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: discordWebhookUrl }),
      })
      setDiscordTestResult(res.ok ? 'success' : 'error')
    } catch {
      setDiscordTestResult('error')
    }
    setDiscordTesting(false)
    setTimeout(() => setDiscordTestResult(null), 3000)
  }

  return (
    <>
      <Header title="設定" />
      <div className="p-6 max-w-2xl space-y-8">
        {/* Team Settings */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold">チーム設定</h3>
          </div>
          <form onSubmit={saveTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">チーム名</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saved ? '保存しました' : saving ? '保存中...' : '保存'}
            </button>
          </form>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">プロフィール設定</h3>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {profileSaved ? '保存しました' : profileSaving ? '保存中...' : '保存'}
            </button>
          </form>
        </div>

        {/* Discord Integration */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-indigo-600" />
            <h3 className="text-lg font-semibold">Discord連携</h3>
            {discordConnected && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">接続済み</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Discord Webhook URLを設定すると、タスクの作成・ステータス変更時にDiscordチャンネルに通知が送信されます。
          </p>
          <form onSubmit={saveDiscord} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="url"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={discordSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {discordSaved ? '保存しました' : discordSaving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={testDiscord}
                disabled={discordTesting || !discordWebhookUrl}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {discordTesting ? 'テスト中...' : 'テスト送信'}
              </button>
              {discordTestResult === 'success' && (
                <span className="text-sm text-green-600">送信成功!</span>
              )}
              {discordTestResult === 'error' && (
                <span className="text-sm text-red-600">送信失敗</span>
              )}
            </div>
          </form>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold">外部連携</h3>
          </div>
          <div className="space-y-3">
            {integrationsList.map((int) => {
              const Icon = int.icon
              return (
                <div key={int.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{int.name}</p>
                      <p className="text-xs text-gray-500">{int.description}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    接続
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
