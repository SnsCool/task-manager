'use client'

import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth'
import type { Goal, Profile } from '@/types'

export function Header({ title }: { title: string }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ goals: Goal[]; profiles: Profile[] }>({ goals: [], profiles: [] })
  const router = useRouter()
  const supabase = createClient()
  const { team } = useAuthStore()

  const search = useCallback(
    async (q: string) => {
      if (!q.trim() || !team) {
        setResults({ goals: [], profiles: [] })
        return
      }
      const [goalsRes, profilesRes] = await Promise.all([
        supabase.from('goals').select('*').eq('team_id', team.id).ilike('title', `%${q}%`).limit(5),
        supabase.from('profiles').select('*').eq('team_id', team.id).ilike('full_name', `%${q}%`).limit(5),
      ])
      setResults({ goals: goalsRes.data || [], profiles: profilesRes.data || [] })
    },
    [team, supabase]
  )

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

      <div className="relative">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  search(e.target.value)
                }}
                placeholder="ゴール・メンバーを検索..."
                className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(results.goals.length > 0 || results.profiles.length > 0) && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                  {results.goals.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">ゴール</p>
                      {results.goals.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => { router.push(`/goals/${g.id}`); setSearchOpen(false); setQuery('') }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          {g.title}
                        </button>
                      ))}
                    </div>
                  )}
                  {results.profiles.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">メンバー</p>
                      {results.profiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { router.push('/members'); setSearchOpen(false); setQuery('') }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          {p.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => { setSearchOpen(false); setQuery(''); setResults({ goals: [], profiles: [] }) }} className="p-1 hover:bg-gray-100 rounded">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg" title="検索">
            <Search size={18} className="text-gray-500" />
          </button>
        )}
      </div>
    </header>
  )
}
