'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getMonthStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}`
}

function Modal({ open, onClose, onSave, editBudget, categories }) {
  const { user } = useAuth()
  const now = new Date()
  const [form, setForm] = useState({ category_id: '', amount: '', month: getMonthStr(now) })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editBudget) {
      setForm({
        category_id: editBudget.category_id,
        amount: editBudget.amount,
        month: editBudget.month,
      })
    } else {
      setForm({ category_id: categories[0]?.id ?? '', amount: '', month: getMonthStr(now) })
    }
    setError('')
  }, [editBudget, open, categories])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category_id || !form.amount) return setError('Vui lòng điền đầy đủ thông tin')
    setLoading(true)
    const data = { category_id: form.category_id, amount: Number(form.amount), month: form.month, user_id: user.id }
    const { error } = editBudget
      ? await supabase.from('budgets').update(data).eq('id', editBudget.id)
      : await supabase.from('budgets').insert(data)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{editBudget ? 'Sửa ngân sách' : 'Thêm ngân sách'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tháng</label>
            <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
              required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục chi tiêu</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
              required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">Chọn danh mục</option>
              {categories.filter(c => c.type === 'expense').map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngân sách (₫)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="500000" min="1" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editBudget ? 'Lưu' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProgressBar({ pct, color }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

export default function BudgetPage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(getMonthStr(now))
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editBudget, setEditBudget] = useState(null)

  const load = async () => {
    if (!user) return
    const [year, mon] = month.split('-').map(Number)
    const nextMonth = mon === 12
      ? `${year + 1}-01`
      : `${year}-${String(mon + 1).padStart(2, '0')}`
    const [{ data: cats }, { data: buds }, { data: txs }] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', month),
      supabase.from('transactions').select('amount, category_id').eq('user_id', user.id)
        .gte('date', month + '-01')
        .lt('date', nextMonth + '-01')
        .eq('type', 'expense'),
    ])

    const spentMap = {}
    for (const tx of txs ?? []) {
      spentMap[tx.category_id] = (spentMap[tx.category_id] ?? 0) + Number(tx.amount)
    }

    const catMap = {}
    for (const c of cats ?? []) catMap[c.id] = c

    const merged = (buds ?? []).map(b => ({
      ...b,
      category: catMap[b.category_id],
      spent: spentMap[b.category_id] ?? 0,
    }))

    setBudgets(merged)
    setCategories(cats ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user, month])

  const handleDelete = async (id) => {
    if (!confirm('Xóa ngân sách này?')) return
    await supabase.from('budgets').delete().eq('id', id)
    load()
  }

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const overallColor = totalPct >= 100 ? '#ef4444' : totalPct >= 80 ? '#f59e0b' : '#10b981'

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ngân sách</h1>
          <p className="text-gray-500 text-sm mt-1">{budgets.length} danh mục được theo dõi</p>
        </div>
        <button onClick={() => { setEditBudget(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm">
          + Thêm ngân sách
        </button>
      </div>

      {/* Month Selector */}
      <div className="mb-5 flex items-center gap-3">
        <button onClick={() => {
          const d = new Date(month + '-01'); d.setMonth(d.getMonth() - 1)
          setMonth(getMonthStr(d))
        }} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">◀</button>
        <span className="font-semibold text-gray-800 min-w-[140px] text-center">
          {MONTHS[parseInt(month.split('-')[1]) - 1]} {month.split('-')[0]}
        </span>
        <button onClick={() => {
          const d = new Date(month + '-01'); d.setMonth(d.getMonth() + 1)
          setMonth(getMonthStr(d))
        }} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">▶</button>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="ml-2 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Overall Summary */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800">Tổng quan tháng này</span>
            <span className="text-sm font-medium" style={{ color: overallColor }}>
              {totalPct.toFixed(0)}%
            </span>
          </div>
          <ProgressBar pct={totalPct} color={overallColor} />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Đã chi: <span className="font-medium text-gray-800">{fmt(totalSpent)}</span></span>
            <span>Ngân sách: <span className="font-medium text-gray-800">{fmt(totalBudget)}</span></span>
          </div>
          {totalPct >= 100 && (
            <div className="mt-3 bg-red-50 text-red-600 text-xs rounded-xl px-3 py-2">
              ⚠️ Đã vượt ngân sách tháng này!
            </div>
          )}
        </div>
      )}

      {/* Budget List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm">Chưa có ngân sách nào cho tháng này</p>
          <button onClick={() => { setEditBudget(null); setModalOpen(true) }}
            className="mt-4 text-indigo-600 text-sm font-medium hover:underline">+ Thêm ngân sách</button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => {
            const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
            const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'
            const remaining = Number(b.amount) - b.spent
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {b.category && (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: (b.category.color ?? '#6366f1') + '20' }}>
                        {b.category.icon}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{b.category?.name ?? 'Danh mục'}</p>
                      <p className="text-xs text-gray-400">{fmt(b.spent)} / {fmt(b.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: barColor }}>{pct.toFixed(0)}%</span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                      <button onClick={() => { setEditBudget(b); setModalOpen(true) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm">✏️</button>
                      <button onClick={() => handleDelete(b.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-sm">🗑️</button>
                    </div>
                  </div>
                </div>
                <ProgressBar pct={pct} color={barColor} />
                <div className="mt-2 flex items-center justify-between text-xs">
                  {pct >= 100 ? (
                    <span className="text-red-500 font-medium">⚠️ Vượt {fmt(Math.abs(remaining))}</span>
                  ) : pct >= 80 ? (
                    <span className="text-amber-500 font-medium">⚡ Còn lại {fmt(remaining)}</span>
                  ) : (
                    <span className="text-green-600 font-medium">✓ Còn lại {fmt(remaining)}</span>
                  )}
                  <span className="text-gray-400">Ngân sách: {fmt(b.amount)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} onSave={load}
        editBudget={editBudget} categories={categories} />
    </AppShell>
  )
}
