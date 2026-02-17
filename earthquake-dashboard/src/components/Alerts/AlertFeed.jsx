import { useAlertStore } from '../../store/alertStore'
import { AlertBadge } from './AlertBadge'

export const AlertFeed = () => {
  const alerts = useAlertStore((s) => s.alerts)

  return (
    <div className="bg-gray-900 rounded-xl p-4 h-80 overflow-y-auto">
      <h2 className="text-white font-bold text-lg mb-3">🔴 Live Alert Feed</h2>
      {alerts.length === 0 && (
        <p className="text-gray-400 text-sm">No alerts yet — polling every 30s</p>
      )}
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-700 py-2 hover:bg-gray-800 transition-colors">
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{alert.location || 'Unknown Location'}</p>
              <p className="text-gray-400 text-xs">{alert.timestamp || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-sm font-bold">
                M{Number(alert.predicted_magnitude || alert.magnitude || 0).toFixed(1)}
              </span>
              <AlertBadge level={alert.alert_level} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
