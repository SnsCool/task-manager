import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  setUnreadCount: (count: number) => void
  markAsRead: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
  }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  markAsRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    )
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    })
  },
}))
