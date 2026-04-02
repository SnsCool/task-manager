'use client'

import { useEffect } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { apiFetch } from '@/lib/api-client'
import type { Profile, Team } from '@/types'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user, team, isLoading, setUser, setTeam, setLoading } = useAuthStore()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      setUser(null)
      setTeam(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const data = await apiFetch<Profile & { team: Team | null }>('/api/me')
        setUser(data)
        setTeam(data.team)
      } catch {
        setUser(null)
        setTeam(null)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    setUser(null)
    setTeam(null)
    await nextAuthSignOut({ redirect: false })
    router.push('/login')
  }

  return { user, team, isLoading: isLoading || status === 'loading', signOut, session }
}
