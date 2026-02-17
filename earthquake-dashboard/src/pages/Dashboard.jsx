import { useLatestAlerts } from '../hooks/useLatestAlerts'
import { useIoTBridge } from '../hooks/useIoTBridge'
import { useAlertStore } from '../store/alertStore'
import { EarthquakeMap } from '../components/Map/EarthquakeMap'
import { AlertFeed } from '../components/Alerts/AlertFeed'
import { StatCards } from '../components/Stats/StatCards'
import { MagnitudeChart } from '../components/Charts/MagnitudeChart'
import { AlertPieChart } from '../components/Charts/AlertPieChart'
import { IoTStatus } from '../components/IoT/IoTStatus'
import { Toaster } from 'react-hot-toast'

export const Dashboard = () => {
  const { data: alerts, isLoading, error } = useLatestAlerts()
  const latestAlert = useAlertStore((s) => s.alerts[0])
  
  useIoTBridge(latestAlert)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
            🔴 AI Earthquake Alert System
          </h1>
          <p className="text-gray-400 text-sm mt-1">India — Real-time Seismic Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-semibold">LIVE</span>
          </div>
          {isLoading && (
            <span className="text-blue-400 text-sm animate-pulse">Syncing...</span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">
            ⚠️ Unable to connect to API. Make sure the FastAPI server is running at {import.meta.env.VITE_API_URL}
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <StatCards />

      {/* Map + Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <EarthquakeMap />
        </div>
        <div className="flex flex-col gap-4">
          <AlertFeed />
          <IoTStatus />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MagnitudeChart />
        <AlertPieChart />
      </div>
    </div>
  )
}
