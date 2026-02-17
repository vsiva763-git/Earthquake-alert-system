import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAlertStore } from '../store/alertStore'
import { PlainEnglishSummary }   from '../components/Explain/PlainEnglishSummary'
import { FeatureBarChart }        from '../components/Explain/FeatureBarChart'
import { RiskFactorTable }        from '../components/Explain/RiskFactorTable'
import { HistoricalComparison }   from '../components/Explain/HistoricalComparison'

const getApiUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL
  if (baseURL && !baseURL.includes('localhost')) return baseURL
  
  // In Codespaces, construct the URL based on current hostname
  if (window.location.hostname.includes('app.github.dev')) {
    const codespaceName = window.location.hostname.split('-').slice(0, -1).join('-')
    return `https://${codespaceName}-8000.app.github.dev`
  }
  return 'http://localhost:8000'
}

export const ExplainPage = () => {
  const alerts = useAlertStore((s) => s.alerts)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [explanation, setExplanation]     = useState(null)
  const [loading, setLoading]             = useState(false)

  const LEVEL_COLOR = {
    HIGH: 'text-red-400 border-red-500 bg-red-900',
    MID:  'text-orange-400 border-orange-500 bg-orange-900',
    LOW:  'text-green-400 border-green-500 bg-green-900'
  }

  const fetchExplanation = async (alert) => {
    console.log('=== Fetching explanation for alert ===')
    console.log('Alert data:', alert)
    console.log('API URL:', getApiUrl())
    
    setSelectedAlert(alert)
    setExplanation(null)
    setLoading(true)
    
    try {
      const payload = {
        latitude:      alert.latitude,
        longitude:     alert.longitude,
        depth_km:      alert.depth_km,
        recent_events: []
      }
      console.log('Request payload:', payload)
      
      const res = await axios.post(
        `${getApiUrl()}/explain`,
        payload
      )
      
      console.log('Raw response:', res)
      console.log('Response status:', res.status)
      console.log('Response data:', res.data)
      console.log('Response data type:', typeof res.data)
      console.log('Response data keys:', res.data ? Object.keys(res.data) : 'null')
      
      // Check if API returned an error
      if (!res.data) {
        console.error('Response data is null/undefined')
        toast.error('API returned empty response')
        setExplanation(null)
      } else if (res.data.error) {
        console.error('API returned error:', res.data.error)
        toast.error(`API Error: ${res.data.error}`)
        setExplanation(null)
      } else {
        console.log('✅ Setting explanation successfully')
        console.log('Features:', res.data.features)
        console.log('Plain english:', res.data.plain_english)
        setExplanation(res.data)
        console.log('✅ Explanation state updated')
      }
    } catch (err) {
      console.error('❌ Exception caught:', err)
      console.error('Error message:', err.message)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      toast.error(`Failed to fetch explanation: ${err.message}`)
      setExplanation(null)
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">
          🧠 Why This Alert?
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Select any alert below to see a detailed explanation of
          why the model predicted this magnitude and alert level.
        </p>
        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-500">
          Total alerts loaded: {alerts.length} | API: {getApiUrl()}
        </div>
        {/* State debug */}
        <div className="mt-1 p-2 bg-gray-900 rounded text-xs font-mono">
          <div>selectedAlert: {selectedAlert ? '✅ ' + selectedAlert.location : '❌ null'}</div>
          <div>loading: {loading ? '⏳ true' : '✅ false'}</div>
          <div>explanation: {explanation ? '✅ loaded' : '❌ null'}</div>
          {explanation && (
            <div className="text-green-400">
              → has features: {explanation.features?.length || 0}
              , has plain_english: {explanation.plain_english?.length || 0}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — Alert Selector */}
        <div className="lg:col-span-1">
          <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-3">
            Select Alert to Explain
          </h2>
          <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-1">
            {alerts.length === 0 && (
              <p className="text-gray-500 text-sm">
                No alerts loaded — go to Dashboard and use
                sample data buttons first.
              </p>
            )}
            {alerts.map((alert, i) => {
              const c = LEVEL_COLOR[alert.alert_level] || LEVEL_COLOR.LOW
              const isSelected = selectedAlert === alert
              return (
                <div key={i}
                  onClick={() => fetchExplanation(alert)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all
                    ${isSelected
                      ? `${c} border-2`
                      : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {alert.location}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {new Date(alert.timestamp).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold text-lg">
                        M{alert.predicted_magnitude}
                      </p>
                      <span className={`text-xs font-bold
                        ${alert.alert_level === 'HIGH' ? 'text-red-400'
                        : alert.alert_level === 'MID'  ? 'text-orange-400'
                        :                                'text-green-400'}`}>
                        {alert.alert_level}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — Explanation Panels */}
        <div className="lg:col-span-2 space-y-6">

          {/* Placeholder */}
          {!selectedAlert && !loading && (
            <div className="bg-gray-800 rounded-2xl p-12 text-center">
              <p className="text-5xl mb-4">🧠</p>
              <p className="text-gray-400 text-lg">
                Select an alert from the list to see why the model
                predicted that magnitude and confidence level.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-gray-800 rounded-2xl p-12 text-center">
              <p className="text-4xl mb-4 animate-spin">⚙️</p>
              <p className="text-gray-400">Analysing model decision...</p>
            </div>
          )}

          {/* Error State - alert selected but no explanation */}
          {selectedAlert && !loading && !explanation && (
            <div className="bg-gray-800 rounded-2xl p-12 text-center border-2 border-red-500">
              <p className="text-5xl mb-4">⚠️</p>
              <p className="text-red-400 text-lg font-semibold mb-2">
                Failed to Load Explanation
              </p>
              <p className="text-gray-400 text-sm">
                The API returned an error or the model couldn't generate
                an explanation for this alert. Check the browser console
                for details.
              </p>
            </div>
          )}

          {/* Explanation Loaded */}
          {explanation && !loading && (
            <>
              {/* Alert Summary Banner */}
              <div className={`rounded-2xl p-5 border-2
                ${LEVEL_COLOR[explanation.alert_level]}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-70 mb-1">
                      Predicted Result
                    </p>
                    <p className="text-4xl font-bold">
                      M{explanation.predicted_magnitude?.toFixed(2)}
                    </p>
                    <p className="text-sm mt-1 opacity-80">
                      {explanation.alert_level} ALERT —{' '}
                      {(explanation.confidence * 100).toFixed(0)}% Confidence
                    </p>
                  </div>
                  <div className="text-6xl opacity-30">
                    {explanation.alert_level === 'HIGH' ? '🔴'
                   : explanation.alert_level === 'MID'  ? '🟠' : '🟢'}
                  </div>
                </div>
              </div>

              {/* Plain English Summary */}
              <PlainEnglishSummary
                sentences={explanation.plain_english}
                alertLevel={explanation.alert_level}
              />

              {/* Feature Importance Bar Chart */}
              <FeatureBarChart features={explanation.features} />

              {/* Risk Factor Table */}
              <RiskFactorTable features={explanation.features} />

              {/* Historical Comparison */}
              <HistoricalComparison
                historical={explanation.historical_avg}
                predicted={explanation.predicted_magnitude}
                alertLevel={explanation.alert_level}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
