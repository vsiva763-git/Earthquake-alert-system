import { useState } from 'react'
import { useAlertStore } from '../../store/alertStore'
import { AlertBadge } from './AlertBadge'
import { AlertDetailModal } from './AlertDetailModal'

export const AlertFeed = () => {
  const alerts = useAlertStore((s) => s.alerts)
  const [selectedAlert, setSelectedAlert] = useState(null)

  return (
    <>
      <div className="bg-gray-900 rounded-xl p-4 h-80 overflow-y-auto">
        <h2 className="text-white font-bold text-lg mb-3">🔴 Live Alert Feed</h2>
        {alerts.length === 0 && (
          <p className="text-gray-400 text-sm">
            No alerts — use sample buttons above or wait for live poll
          </p>
        )}
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              onClick={() => setSelectedAlert(alert)}
              className="flex items-center justify-between border-b border-gray-700
                         py-2 cursor-pointer hover:bg-gray-800 px-2 rounded
                         transition-colors duration-150"
            >
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{alert.location || 'Unknown Location'}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(alert.timestamp).toLocaleString('en-IN')}
                </p>
                {alert.source === 'DEMO' && (
                  <span className="text-purple-400 text-xs">📋 DEMO</span>
                )}
                {alert.source === 'SIMULATED' && (
                  <span className="text-yellow-400 text-xs">🎲 SIMULATED</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-sm font-bold">
                  M{Number(alert.predicted_magnitude || alert.magnitude || 0).toFixed(1)}
                </span>
                <AlertBadge level={alert.alert_level} />
                <span className="text-gray-500 text-xs">›</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal opens on click */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </>
  )
}
