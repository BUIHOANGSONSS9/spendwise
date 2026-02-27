'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const BarChart = dynamic(() => import('recharts').then(m => ({ default: m.BarChart })), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => ({ default: m.Bar })), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false })

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function fmt(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, txCount: 0 })
  const [chartData, setChartData] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      const [{ data: txs }, { data: allTxs }] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', firstDay),
        supabase.from('transactions').select('*, categories(name, icon, color)').eq('user_id', user.id)
          .order('date', { ascending: false }).limit(5),
      ])

      const income = txs?.filter(t => t.type === 'income').reduce((s, t) => s + +t.amount, 0) ?? 0
      const expense = txs?.filter(t => t.type === 'expense').reduce((s, t) => s + +t.amount, 0) ?? 0

      // Build 6-month chart
      const monthMap = {}
      const now2 = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthMap[key] = { month: MONTHS[d.getMonth()], income: 0, expense: 0 }
      }
      allTxs?.forEach(t => {
        const key = t.date.slice(0, 7)
        if (monthMap[key]) {
          if (t.type === 'income') monthMap[key].income += +t.amount
          else monthMap[key].expense += +t.amount
        }
      })

      setStats({ income, expense, balance: income - expense, txCount: txs?.length ?? 0 })
      setChartData(Object.values(monthMap))
      setRecent(allTxs ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  const now = new Date()
  const monthLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{monthLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Số dư" value={fmt(stats.balance)} icon="💳" color="bg-indigo-50"
          sub={stats.balance >= 0 ? 'Dương 👍' : 'Âm ⚠️'} />
        <StatCard label="Thu nhập" value={fmt(stats.income)} icon="📈" color="bg-green-50" sub={monthLabel} />
        <StatCard label="Chi tiêu" value={fmt(stats.expense)} icon="📉" color="bg-red-50" sub={monthLabel} />
        <StatCard label="Giao dịch" value={stats.txCount} icon="🧾" color="bg-orange-50" sub="tháng này" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Thu/Chi 6 tháng gần nhất</h2>
          {!loading && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : `${(v/1e3).toFixed(0)}K`} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="income" name="Thu" fill="#6366f1" radius={[6,6,0,0]} />
                <Bar dataKey="expense" name="Chi" fill="#f87171" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Giao dịch gần đây</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có giao dịch nào</div>
          ) : (
            <div className="space-y-3">
              {recent.map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: t.categories?.color + '20' }}>
                    {t.categories?.icon ?? '💸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.note || t.categories?.name || 'Giao dịch'}</p>
                    <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
