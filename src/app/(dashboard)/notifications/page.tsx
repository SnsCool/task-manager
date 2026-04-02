'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, Target, Users, MessageSquare } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { Header } from '@/components/layout/Header'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types'

const typeIcons: Record<string, React.ElementType> = {
  goal_assigned: Target,
  goal_updated: Target,
  comment_added: MessageSquare,
  invitation: Users,
  reminder: Bell,
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const { notifications, setNotifications } = useNotificationStore()
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    const fetchNotifications = async () => {
      try {
        const data = await apiFetch<Notification[]>('/api/notifications')
        setNotifications(data)
      } catch {
        // ignore
      }
    }
    fetchNotifications()
  }, [user, setNotifications])

  const markAsRead = async (n: Notification) => {
    if (n.is_read) return
    await apiFetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id: n.id }),
    })
    setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
  }

  const markAllRead = async () => {
    if (!user) return
    await apiFetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ mark_all_read: true }),
    })
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
  }

  const handleClick = (n: Notification) => {
    markAsRead(n)
    if (n.related_goal_id) router.push(`/goals/${n.related_goal_id}`)
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })

  return (
    <>
      <Header title="通知" />
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'すべて' : f === 'unread' ? '未読' : '既読'}
              </button>
            ))}
          </div>
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <CheckCheck size={16} /> すべて既読にする
          </button>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">通知はありません</p>
            </div>
          ) : (
            filtered.map((n) => {
              const Icon = typeIcons[n.type] || Bell
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left bg-white rounded-lg border p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                    !n.is_read ? 'border-blue-200 bg-blue-50/50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    !n.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold' : ''}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
