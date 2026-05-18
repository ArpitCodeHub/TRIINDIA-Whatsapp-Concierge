'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Users,
  BarChart3,
  BookOpen,
  Settings,
  Home,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/guests', label: 'Guests', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold">TRIINDIA</h1>
        <p className="text-xs text-gray-400 mt-1">Hospitality Concierge</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Link>
      </div>
    </aside>
  )
}
