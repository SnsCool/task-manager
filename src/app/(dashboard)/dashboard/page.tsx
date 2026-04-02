'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { Header } from '@/components/layout/Header'

type AlertKpi = {
  id: string
  title: string
  metricName: string | null
  metricUnit: string | null
  metricTarget: number | null
  metricCurrent: number | null
  progress: number
  issueCount: number
  taskCount: number
}

type DashboardData = {
  kpiSummary: {
    total: number
    achieved: number
    notAchieved: number
    noData: number
  }
  kgiCount: number
  alertKpis: AlertKpi[]
  taskStats: {
    total: number
    completed: number
  }
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: typeof BarChart3
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon size={18} className={color} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { team } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    if (!team) return
    try {
      const result = await apiFetch<DashboardData>('/api/dashboard/summary')
      setData(result)
    } catch {
      // ignore
    }
    setLoading(false)
  }, [team])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) {
    return (
      <>
        <Header title="KPIダッシュボード" />
        <div className="p-6 text-center text-gray-400 text-sm">読み込み中...</div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <Header title="KPIダッシュボード" />
        <div className="p-6 text-center text-gray-400">データの取得に失敗しました</div>
      </>
    )
  }

  const { kpiSummary, alertKpis, taskStats } = data

  return (
    <>
      <Header title="KPIダッシュボード" />
      <div className="p-6 max-w-5xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label="全KPI数"
            value={kpiSummary.total}
            icon={BarChart3}
            color="text-gray-700"
          />
          <SummaryCard
            label="達成"
            value={kpiSummary.achieved}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <SummaryCard
            label="未達"
            value={kpiSummary.notAchieved}
            icon={AlertCircle}
            color="text-red-500"
          />
          <SummaryCard
            label="未計測"
            value={kpiSummary.noData}
            icon={HelpCircle}
            color="text-gray-400"
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Alert KPIs */}
          <div className="col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              要注意KPI
            </h3>
            {alertKpis.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-green-700">全てのKPIが目標を達成しています</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertKpis.map((kpi) => {
                  const currentVal = kpi.metricCurrent ?? 0
                  const targetVal = kpi.metricTarget ?? 0
                  const percentage =
                    targetVal > 0 ? Math.round((currentVal / targetVal) * 100) : 0
                  const gap = targetVal - currentVal
                  const isNegativeBetter = kpi.metricUnit === '%' && kpi.metricName?.includes('率')

                  return (
                    <div
                      key={kpi.id}
                      className="bg-white rounded-xl border border-red-100 p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link
                            href={`/goals/${kpi.id}`}
                            className="text-sm font-semibold text-gray-800 hover:text-blue-600"
                          >
                            {kpi.title}
                          </Link>
                          {kpi.metricName && (
                            <p className="text-xs text-gray-500 mt-0.5">{kpi.metricName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-500">
                            {currentVal}
                            <span className="text-sm text-gray-400">
                              {kpi.metricUnit || ''}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">
                            目標: {targetVal}
                            {kpi.metricUnit || ''}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full bg-red-400 transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {isNegativeBetter ? (
                            <TrendingDown size={12} className="text-red-400" />
                          ) : (
                            <TrendingUp size={12} className="text-red-400" />
                          )}
                          あと {Math.abs(gap).toFixed(1)}
                          {kpi.metricUnit || ''} {isNegativeBetter ? '削減' : '必要'}
                        </span>
                        <span>
                          課題 {kpi.issueCount}件 / タスク {kpi.taskCount}件
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Task Stats */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">タスク進捗</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-800">
                  {taskStats.completed}
                </span>
                <span className="text-gray-400 text-sm mb-1">
                  / {taskStats.total} 完了
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">クイックアクセス</h3>
              <div className="space-y-2">
                <Link
                  href="/kpi-tree"
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                >
                  KPIツリー
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
                <Link
                  href="/execution"
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                >
                  今日のタスク
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
                <Link
                  href="/goals"
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                >
                  ゴール一覧
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
