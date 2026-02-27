'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Mật khẩu không khớp')
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự')
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Kiểm tra email!</h2>
        <p className="text-gray-500 text-sm mb-6">Chúng tôi đã gửi link xác nhận đến <strong>{form.email}</strong>. Nhấn vào link để hoàn tất đăng ký.</p>
        <Link href="/login" className="text-indigo-600 font-medium hover:underline text-sm">← Quay lại đăng nhập</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <span className="text-2xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SpendWise</h1>
          <p className="text-gray-500 text-sm mt-1">Tạo tài khoản miễn phí</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Đăng ký</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Mật khẩu', key: 'password', type: 'password', placeholder: 'Tối thiểu 6 ký tự' },
              { label: 'Xác nhận mật khẩu', key: 'confirm', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Tạo tài khoản
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
