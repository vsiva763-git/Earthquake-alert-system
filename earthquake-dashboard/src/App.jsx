import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Dashboard } from './pages/Dashboard'
import { DeviceManagement } from './pages/DeviceManagement'
import { ExplainPage } from './pages/ExplainPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />

      {/* Top Navigation */}
      <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3
                      flex items-center gap-6 sticky top-0 z-30">
        <span className="text-red-500 font-bold text-lg">🔴 EarthAlert India</span>
        <div className="flex gap-2 ml-4">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'devices',   label: '📡 Devices' },
            { id: 'explain',   label: '🧠 Why This Alert?' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setPage(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${page === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Pages */}
      {page === 'dashboard' && <Dashboard />}
      {page === 'devices'   && <DeviceManagement />}
      {page === 'explain'   && <ExplainPage />}
    </QueryClientProvider>
  )
}
