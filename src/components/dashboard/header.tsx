export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            TRIINDIA Hospitality
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI Concierge Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-300">AI Online</span>
        </div>
      </div>
    </header>
  )
}
