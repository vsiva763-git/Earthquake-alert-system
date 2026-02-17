import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAlertStore } from '../../store/alertStore'
import { demoScenario } from '../../data/demoScenario'

export const SampleDataBar = () => {
  const [loading, setLoading] = useState(null)
  const setAlerts = useAlertStore((s) => s.setAlerts)
  const alerts = useAlertStore((s) => s.alerts)

  // Get API URL
  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    if (window.location.hostname.includes('app.github.dev')) {
      const codespaceName = window.location.hostname.split('-').slice(0, -1).join('-')
      return `https://${codespaceName}-8000.app.github.dev`
    }
    return 'http://localhost:8000'
  }

  // Button 1 — Generate random fake alert
  const generateFakeAlert = () => {
    setLoading('fake')
    const zones = [
      'Gujarat Region', 'Delhi NCR', 'Chennai Coast',
      'Guwahati, Assam', 'Kashmir Valley', 'Andaman Islands',
      'Mumbai Coast', 'Uttarakhand Hills', 'Bihar Plains'
    ]
    const magnitude = parseFloat((Math.random() * 5 + 1.5).toFixed(1))
    const alert_level = magnitude < 4.0 ? 'LOW' : magnitude < 5.5 ? 'MID' : 'HIGH'
    const fake = {
      predicted_magnitude: magnitude,
      alert_level,
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)),
      location: zones[Math.floor(Math.random() * zones.length)],
      latitude: 8 + Math.random() * 28,
      longitude: 68 + Math.random() * 30,
      depth_km: Math.floor(Math.random() * 60 + 5),
      seismic_zone: Math.floor(Math.random() * 4 + 2),
      timestamp: new Date().toISOString(),
      recommendation:
        alert_level === 'HIGH' ? 'Evacuate immediately — seek open ground' :
        alert_level === 'MID'  ? 'Precautionary alert — monitor updates' :
                                  'Informational only — no action needed',
      aftershock_probability: `${Math.floor(Math.random() * 80 + 5)}%`,
      affected_radius_km: Math.floor(magnitude * 20),
      source: 'SIMULATED'
    }
    // Add to existing alerts (incremental)
    setAlerts([fake, ...alerts].slice(0, 50))
    toast.success(`Fake ${alert_level} alert generated — M${magnitude}`)
    setLoading(null)
  }

  // Button 2 — Fetch real USGS live data
  const fetchLiveUSGS = async () => {
    setLoading('live')
    try {
      // Clear existing alerts first for clean slate
      setAlerts([])
      
      const res = await axios.get(`${getApiUrl()}/live-feed`)
      if (res.data && res.data.status !== 'no-data') {
        setAlerts([res.data])
        toast.success(`Live USGS data fetched — ${res.data.alert_level} alert`)
      } else {
        toast('No recent earthquakes in India (good news!)', { icon: '✅' })
      }
    } catch (err) {
      console.error('Live feed error:', err)
      toast.error('Failed to fetch live data — check API connection')
    }
    setLoading(null)
  }

  // Button 3 — Load pre-built demo scenario
  const loadDemoScenario = () => {
    setLoading('demo')
    // Clear existing alerts and load demo
    setAlerts(demoScenario)
    toast('Demo scenario loaded — 6 alerts across India', { icon: '🗺️' })
    setLoading(null)
  }

  // Button 4 — Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([])
    toast('All alerts cleared', { icon: '🗑️' })
  }

  const btnBase = "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50"

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
      <span className="text-gray-400 text-sm font-medium mr-2">🧪 Sample Data:</span>

      {/* Button 1 — Random Fake */}
      <button
        onClick={generateFakeAlert}
        disabled={loading === 'fake'}
        className={`${btnBase} bg-purple-600 hover:bg-purple-500 text-white`}
      >
        {loading === 'fake' ? '⏳' : '🎲'} Generate Random Alert
      </button>

      {/* Button 2 — Live USGS */}
      <button
        onClick={fetchLiveUSGS}
        disabled={loading === 'live'}
        className={`${btnBase} bg-blue-600 hover:bg-blue-500 text-white`}
      >
        {loading === 'live' ? '⏳' : '🌍'} Fetch Live USGS Data
      </button>

      {/* Button 3 — Demo Scenario */}
      <button
        onClick={loadDemoScenario}
        disabled={loading === 'demo'}
        className={`${btnBase} bg-green-700 hover:bg-green-600 text-white`}
      >
        {loading === 'demo' ? '⏳' : '📋'} Load Demo Scenario
      </button>

      {/* Button 4 — Clear All */}
      <button
        onClick={clearAllAlerts}
        disabled={loading || alerts.length === 0}
        className={`${btnBase} bg-gray-700 hover:bg-gray-600 text-white`}
      >
        🗑️ Clear All
      </button>

      <span className="ml-auto text-xs text-gray-500">
        {alerts.length} alerts loaded
      </span>
    </div>
  )
}
