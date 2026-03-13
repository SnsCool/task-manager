'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Target,
  ListTodo,
  Bell,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GanttChartSquare,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationStore } from '@/stores/notifications'

const navItems = [
  { href: '/gantt', label: 'ガントチャート', icon: GanttChartSquare },
  { href: '/goals', label: 'ゴール', icon: Target },
  { href: '/execution', label: '実行', icon: ListTodo },
  { href: '/notifications', label: '通知', icon: Bell },
  { href: '/members', label: 'メンバー', icon: Users },
  { href: '/settings', label: '設定', icon: Settings },
  { href: '/help', label: 'ヘルプ', icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, team, signOut } = useAuth()
  const { unreadCount } = useNotificationStore()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex flex-col bg-gray-900 text-white transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{team?.name || 'TaskManager'}</h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-800 shrink-0"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="relative shrink-0">
                <Icon size={20} />
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
            {user?.full_name?.charAt(0) || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} className="p-1 rounded hover:bg-gray-800 shrink-0" title="ログアウト">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
