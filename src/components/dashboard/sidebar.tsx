'use client'

import { useState } from 'react'
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
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/guests', label: 'Guests', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  const content = (
    <aside className="w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold">TRIINDIA</h1>
          <p className="text-xs text-gray-400 mt-1">Hospitality Concierge</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">Logout</span>
        </Link>
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden lg:block">{content}</div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50">{content}</div>
        </div>
      )}
    </>
  )
}
