'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Mail, Search, ChevronRight, UserPlus, X } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { Header } from '@/components/layout/Header'
import type { Profile, TeamInvitation } from '@/types'

export default function MembersPage() {
  const { user, team } = useAuthStore()
  const [members, setMembers] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [inviting, setInviting] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)

  const fetchData = useCallback(async () => {
    if (!team) return
    try {
      const [membersData, invitesData] = await Promise.all([
        apiFetch<Profile[]>('/api/members'),
        apiFetch<TeamInvitation[]>('/api/invitations'),
      ])
      setMembers(membersData)
      setInvitations(invitesData)
    } catch {
      // ignore
    }
  }, [team])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !user || !team) return
    setInviting(true)

    await apiFetch('/api/invitations', {
      method: 'POST',
      body: JSON.stringify({
        email: inviteEmail.trim(),
        role: inviteRole,
      }),
    })

    setInviteEmail('')
    setShowInvite(false)
    setInviting(false)
    fetchData()
  }

  const updateManager = async (memberId: string, managerId: string | null) => {
    await apiFetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ manager_id: managerId }),
    })
    fetchData()
    setSelectedMember(null)
  }

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const directReports = (managerId: string) =>
    members.filter((m) => m.manager_id === managerId)

  return (
    <>
      <Header title="メンバー" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="メンバーを検索..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <UserPlus size={16} /> メンバーを招待
            </button>
          )}
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filtered.map((member) => {
            const reports = directReports(member.id)
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="bg-white rounded-xl border p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                    {member.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role === 'admin' ? '管理者' : 'メンバー'}
                  </span>
                </div>
                {reports.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users size={12} />
                    <span>直下のメンバー: {reports.length}人</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">保留中の招待 ({invitations.length})</h3>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-white rounded-lg border p-3 flex items-center gap-3">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-sm flex-1">{inv.email}</span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">保留中</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">メンバーを招待</h3>
              <button onClick={() => setShowInvite(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="member@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">役割</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="member">メンバー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                  キャンセル
                </button>
                <button type="submit" disabled={inviting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {inviting ? '送信中...' : '招待を送信'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">メンバー詳細</h3>
              <button onClick={() => setSelectedMember(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">
                {selectedMember.full_name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{selectedMember.full_name}</p>
                <p className="text-sm text-gray-500">{selectedMember.email}</p>
              </div>
            </div>

            {user?.role === 'admin' && selectedMember.id !== user.id && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">マネージャー</label>
                <select
                  value={selectedMember.manager_id || ''}
                  onChange={(e) => updateManager(selectedMember.id, e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">なし</option>
                  {members
                    .filter((m) => m.id !== selectedMember.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">直下のメンバー</h4>
              {directReports(selectedMember.id).length === 0 ? (
                <p className="text-sm text-gray-400">直下のメンバーはいません</p>
              ) : (
                <div className="space-y-1">
                  {directReports(selectedMember.id).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {r.full_name.charAt(0)}
                      </div>
                      <span className="text-sm">{r.full_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
