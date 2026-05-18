import { Menu } from 'lucide-react'

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              TRIINDIA Hospitality
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              AI Concierge Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">AI Online</span>
        </div>
      </div>
    </header>
  )
}
