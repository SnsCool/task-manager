import { create } from 'zustand'
import type { Goal, GoalWithChildren } from '@/types'

interface GoalState {
  goals: Goal[]
  selectedGoal: Goal | null
  isLoading: boolean
  setGoals: (goals: Goal[]) => void
  setSelectedGoal: (goal: Goal | null) => void
  setLoading: (loading: boolean) => void
  buildTree: (goals: Goal[]) => GoalWithChildren[]
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  selectedGoal: null,
  isLoading: false,
  setGoals: (goals) => set({ goals }),
  setSelectedGoal: (selectedGoal) => set({ selectedGoal }),
  setLoading: (isLoading) => set({ isLoading }),
  buildTree: (goals: Goal[]) => {
    const map = new Map<string | null, GoalWithChildren[]>()

    goals.forEach((goal) => {
      const parentId = goal.parent_id
      if (!map.has(parentId)) map.set(parentId, [])
      map.get(parentId)!.push({ ...goal, children: [] })
    })

    const buildChildren = (parentId: string | null): GoalWithChildren[] => {
      const children = map.get(parentId) || []
      return children.map((child) => ({
        ...child,
        children: buildChildren(child.id),
      }))
    }

    return buildChildren(null)
  },
}))
