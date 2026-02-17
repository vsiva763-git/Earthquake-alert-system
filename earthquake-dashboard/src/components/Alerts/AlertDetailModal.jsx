const LEVEL_COLORS = {
  HIGH: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-400', badge: 'bg-red-600' },
  MID:  { bg: 'bg-orange-900', border: 'border-orange-500', text: 'text-orange-400', badge: 'bg-orange-500' },
  LOW:  { bg: 'bg-green-900', border: 'border-green-500', text: 'text-green-400', badge: 'bg-green-600' }
}

const InfoRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-700">
    <span className="text-gray-400 text-sm">{label}</span>
    <span className={`text-sm font-semibold ${highlight ? 'text-yellow-400' : 'text-white'}`}>
      {value}
    </span>
  </div>
)

export const AlertDetailModal = ({ alert, onClose }) => {
  if (!alert) return null
  const c = LEVEL_COLORS[alert.alert_level] || LEVEL_COLORS.LOW

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className={`bg-gray-900 border-2 ${c.border} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`${c.bg} rounded-t-2xl p-5`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`${c.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                {alert.alert_level} ALERT
              </span>
              <h2 className="text-white text-2xl font-bold mt-2">
                M{Number(alert.predicted_magnitude || alert.magnitude || 0).toFixed(1)}
              </h2>
              <p className="text-gray-300 text-sm mt-1">{alert.location || 'Unknown Location'}</p>
            </div>
            <button onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Recommendation Banner */}
          <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              ⚠️ Recommendation
            </p>
            <p className={`${c.text} font-semibold text-sm`}>
              {alert.recommendation || 'Monitor situation closely'}
            </p>
          </div>

          {/* Core Details */}
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
              Seismic Details
            </h3>
            <InfoRow label="Predicted Magnitude" 
              value={`M${Number(alert.predicted_magnitude || alert.magnitude || 0).toFixed(1)}`} highlight />
            <InfoRow label="Alert Level" value={alert.alert_level} />
            <InfoRow label="Confidence Score"
              value={`${(alert.confidence * 100).toFixed(0)}%`} />
            <InfoRow label="Depth" value={`${alert.depth_km || 'N/A'} km`} />
            <InfoRow label="Seismic Zone" value={`Zone ${alert.seismic_zone || 'N/A'}`} />
            <InfoRow label="Coordinates"
              value={`${alert.latitude?.toFixed(2)}°N, ${alert.longitude?.toFixed(2)}°E`} />
          </div>

          {/* Risk Assessment */}
          {(alert.aftershock_probability || alert.affected_radius_km) && (
            <div>
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                Risk Assessment
              </h3>
              {alert.aftershock_probability && (
                <InfoRow label="Aftershock Probability"
                  value={alert.aftershock_probability} highlight />
              )}
              {alert.affected_radius_km && (
                <InfoRow label="Estimated Affected Radius"
                  value={`${alert.affected_radius_km} km`} />
              )}
              <InfoRow label="Depth Classification"
                value={alert.depth_km < 10 ? 'Shallow (High Surface Impact)'
                     : alert.depth_km < 30 ? 'Intermediate'
                     : 'Deep (Reduced Surface Impact)'} />
            </div>
          )}

          {/* What To Do */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white text-sm font-bold mb-3">
              📋 What To Do Right Now
            </h3>
            {alert.alert_level === 'HIGH' && (
              <ul className="space-y-1 text-sm text-gray-300">
                <li>🔴 Move to open ground away from buildings immediately</li>
                <li>🔴 Stay away from windows, heavy furniture, and walls</li>
                <li>🔴 Do not use elevators — use stairs only</li>
                <li>🔴 If driving, pull over away from bridges and overpasses</li>
                <li>🔴 After shaking stops, check for injuries and gas leaks</li>
                <li>🔴 Contact emergency services: NDRF — 011-24363260</li>
              </ul>
            )}
            {alert.alert_level === 'MID' && (
              <ul className="space-y-1 text-sm text-gray-300">
                <li>🟠 Move away from glass, shelves, and heavy objects</li>
                <li>🟠 Drop, cover, and hold on if shaking begins</li>
                <li>🟠 Keep away from exterior walls and windows</li>
                <li>🟠 Monitor updates every 5 minutes on this dashboard</li>
                <li>🟠 Prepare emergency kit in case situation escalates</li>
              </ul>
            )}
            {alert.alert_level === 'LOW' && (
              <ul className="space-y-1 text-sm text-gray-300">
                <li>🟢 No immediate action required</li>
                <li>🟢 Monitor dashboard for any escalation</li>
                <li>🟢 Minor tremor — may be felt but unlikely to cause damage</li>
                <li>🟢 Ensure emergency contacts are up to date</li>
              </ul>
            )}
          </div>

          {/* Meta */}
          <div>
            <InfoRow label="Data Source"
              value={alert.source || 'USGS Live Feed'} />
            <InfoRow label="Detected At"
              value={new Date(alert.timestamp).toLocaleString('en-IN')} />
          </div>
        </div>
      </div>
    </div>
  )
}
