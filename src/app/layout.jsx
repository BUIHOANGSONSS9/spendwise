import './globals.css'
import { AuthProvider } from '../hooks/useAuth'

export const metadata = { title: 'SpendWise', description: 'Quản lý chi tiêu cá nhân' }

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
