'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

function Modal({ open, onClose, onSave, categories, editTx }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ type: 'expense', amount: '', category_id: '', note: '', date: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editTx) setForm({ type: editTx.type, amount: editTx.amount, category_id: editTx.category_id || '', note: editTx.note || '', date: editTx.date })
    else setForm({ type: 'expense', amount: '', category_id: '', note: '', date: new Date().toISOString().split('T')[0] })
    setError('')
  }, [editTx, open])

  if (!open) return null

  const filtered = categories.filter(c => c.type === form.type)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return setError('Số tiền không hợp lệ')
    setLoading(true)
    const data = { ...form, amount: +form.amount, user_id: user.id }
    const { error } = editTx
      ? await supabase.from('transactions').update(data).eq('id', editTx.id)
      : await supabase.from('transactions').insert(data)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{editTx ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* Type toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            {['expense', 'income'].map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category_id: '' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${form.type === t ? (t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'text-gray-600'}`}>
                {t === 'expense' ? '📉 Chi tiêu' : '📈 Thu nhập'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số tiền (₫)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="0" min="1" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Chọn danh mục --</option>
              {filtered.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
            <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Mô tả giao dịch..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition">Hủy</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editTx ? 'Lưu' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [txs, setTxs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    if (!user) return
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('transactions').select('*, categories(name, icon, color)').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id),
    ])
    setTxs(t ?? [])
    setCategories(c ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const handleDelete = async (id) => {
    if (!confirm('Xóa giao dịch này?')) return
    await supabase.from('transactions').delete().eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter)
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + +t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + +t.amount, 0)

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giao dịch</h1>
          <p className="text-gray-500 text-sm mt-1">{txs.length} giao dịch</p>
        </div>
        <button onClick={() => { setEditTx(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm">
          + Thêm mới
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng thu', value: fmt(totalIncome), color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Tổng chi', value: fmt(totalExpense), color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Số dư', value: fmt(totalIncome - totalExpense), color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`font-bold text-sm sm:text-base ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[['all','Tất cả'],['expense','Chi tiêu'],['income','Thu nhập']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${filter === val ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: (t.categories?.color ?? '#6366f1') + '20' }}>
                  {t.categories?.icon ?? '💸'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{t.note || t.categories?.name || 'Giao dịch'}</p>
                  <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('vi-VN')} · {t.categories?.name ?? 'Chưa phân loại'}</p>
                </div>
                <span className={`text-sm font-semibold mr-3 ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                  <button onClick={() => { setEditTx(t); setModalOpen(true) }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">✏️</button>
                  <button onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} onSave={load} categories={categories} editTx={editTx} />
    </AppShell>
  )
}
