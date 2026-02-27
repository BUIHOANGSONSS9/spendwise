'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const ICONS = ['🍜','🚗','🏠','🎮','👕','💊','📚','✈️','☕','🛒','💪','🎬','🐶','🎁','💡','📱','🏦','💼']
const COLORS = ['#6366f1','#f43f5e','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6']

function Modal({ open, onClose, onSave, editCat }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', icon: '💰', color: '#6366f1', type: 'expense' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editCat) setForm({ name: editCat.name, icon: editCat.icon, color: editCat.color, type: editCat.type })
    else setForm({ name: '', icon: '💰', color: '#6366f1', type: 'expense' })
    setError('')
  }, [editCat, open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Tên danh mục không được trống')
    setLoading(true)
    const data = { ...form, user_id: user.id }
    const { error } = editCat
      ? await supabase.from('categories').update(data).eq('id', editCat.id)
      : await supabase.from('categories').insert(data)
    if (error) setError(error.message)
    else { onSave(); onClose() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{editCat ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* Type */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            {['expense','income'].map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition
                  ${form.type === t ? (t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'text-gray-600'}`}>
                {t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên danh mục</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ăn uống, Di chuyển..." required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-9 gap-1.5">
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition
                    ${form.icon === icon ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full transition ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: form.color + '25' }}>
              {form.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{form.name || 'Tên danh mục'}</p>
              <p className="text-xs text-gray-400">{form.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editCat ? 'Lưu' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [tab, setTab] = useState('expense')

  const load = async () => {
    if (!user) return
    const { data } = await supabase.from('categories').select('*').eq('user_id', user.id).order('created_at')
    setCats(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const handleDelete = async (id) => {
    if (!confirm('Xóa danh mục này? Các giao dịch liên quan sẽ mất danh mục.')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  const filtered = cats.filter(c => c.type === tab)

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục</h1>
          <p className="text-gray-500 text-sm mt-1">{cats.length} danh mục</p>
        </div>
        <button onClick={() => { setEditCat(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm">
          + Thêm danh mục
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['expense','📉 Chi tiêu'],['income','📈 Thu nhập']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition
              ${tab === val ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-sm">Chưa có danh mục {tab === 'expense' ? 'chi tiêu' : 'thu nhập'} nào</p>
          <button onClick={() => { setEditCat(null); setModalOpen(true) }}
            className="mt-4 text-indigo-600 text-sm font-medium hover:underline">+ Thêm ngay</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm group relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                style={{ backgroundColor: c.color + '20' }}>
                {c.icon}
              </div>
              <p className="font-medium text-gray-800 text-sm">{c.name}</p>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1 transition">
                <button onClick={() => { setEditCat(c); setModalOpen(true) }}
                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">✏️</button>
                <button onClick={() => handleDelete(c.id)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} onSave={load} editCat={editCat} />
    </AppShell>
  )
}
