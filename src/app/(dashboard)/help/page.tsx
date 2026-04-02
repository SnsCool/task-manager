'use client'

import { useEffect, useState } from 'react'
import { Search, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { Header } from '@/components/layout/Header'
import type { HelpArticle } from '@/types'

const categoryLabels: Record<string, string> = {
  getting_started: 'はじめに',
  goals: 'ゴール管理',
  team: 'チーム',
  execution: '実行',
  notifications: '通知',
  general: '一般',
}

export default function HelpPage() {
  const [articles, setArticles] = useState<HelpArticle[]>([])
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await apiFetch<HelpArticle[]>('/api/help-articles')
        setArticles(data)
      } catch {
        // ignore
      }
    }
    fetchArticles()
  }, [])

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(filtered.map((a) => a.category))]

  return (
    <>
      <Header title="ヘルプ" />
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ヘルプ記事を検索..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">記事が見つかりません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  {categoryLabels[cat] || cat}
                </h3>
                <div className="space-y-2">
                  {filtered
                    .filter((a) => a.category === cat)
                    .map((article) => (
                      <div key={article.id} className="bg-white rounded-lg border">
                        <button
                          onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                          className="w-full text-left p-4 flex items-center gap-3"
                        >
                          {expandedId === article.id ? (
                            <ChevronDown size={16} className="text-gray-400 shrink-0" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium">{article.title}</span>
                        </button>
                        {expandedId === article.id && (
                          <div className="px-4 pb-4 pl-11">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{article.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
