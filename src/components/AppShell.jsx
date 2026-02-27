'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/transactions', icon: '💸', label: 'Giao dịch' },
  { href: '/categories', icon: '🏷️', label: 'Danh mục' },
  { href: '/budget', icon: '🎯', label: 'Ngân sách' },
]

export default function AppShell({ children }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-50 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-lg">💰</div>
            <span className="font-bold text-gray-900 text-lg">SpendWise</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${pathname === item.href
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-gray-900">SpendWise</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
