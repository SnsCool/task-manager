import { create } from 'zustand'
import type { Profile, Team } from '@/types'

interface AuthState {
  user: Profile | null
  team: Team | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setTeam: (team: Team | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  team: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setTeam: (team) => set({ team }),
  setLoading: (isLoading) => set({ isLoading }),
}))
