'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationStore } from '@/stores/notifications'
import { apiFetch } from '@/lib/api-client'
import type { Notification } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, team, isLoading } = useAuth()
  const router = useRouter()
  const { setNotifications } = useNotificationStore()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user && !team) {
      setShowOnboarding(true)
    }
  }, [isLoading, user, team, router])

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<Notification[]>('/api/notifications')
      setNotifications(data)
    } catch { /* ignore */ }
  }, [setNotifications])

  useEffect(() => {
    if (!team) return
    fetchNotifications()

    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [team, fetchNotifications])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) return
    setCreating(true)

    try {
      await apiFetch('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name: teamName.trim() }),
      })
      window.location.reload()
    } catch {
      setCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (showOnboarding) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">チームを作成</h2>
            <p className="text-sm text-gray-500 mb-6">組織名を入力して、チームを作成しましょう</p>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">チーム名</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="例: 株式会社サンプル"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                {creating ? '作成中...' : 'チームを作成'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
    </div>
  )
}
