'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const router = useRouter()
  const { user, team, isLoading, setUser, setTeam, setLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setUser(null)
        setTeam(null)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser(profile)
        if (profile.team_id) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('*')
            .eq('id', profile.team_id)
            .single()
          setTeam(teamData)
        }
      }
      setLoading(false)
    }

    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setTeam(null)
        router.push('/login')
      } else {
        fetchProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTeam(null)
    router.push('/login')
  }

  return { user, team, isLoading, signOut }
}
