const LEVEL_COLORS = {
  HIGH: 'border-red-500 text-red-400',
  MID:  'border-orange-500 text-orange-400',
  LOW:  'border-green-500 text-green-400'
}

export const AlertDetailPanel = ({ alert, onClose }) => {
  if (!alert) return null
  const color = LEVEL_COLORS[alert.alert_level] || LEVEL_COLORS.LOW

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-gray-900 border-l-4
                     ${color.split(' ')[0]} z-40 overflow-y-auto shadow-2xl
                     transform transition-transform duration-300`}>
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold text-lg">Alert Details</h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className={`text-4xl font-bold ${color.split(' ')[1]} mb-1`}>
          M{Number(alert.predicted_magnitude || alert.magnitude || 0).toFixed(1)}
        </div>
        <p className="text-white font-semibold mb-1">{alert.location || 'Unknown Location'}</p>
        <p className="text-gray-400 text-xs mb-4">
          {new Date(alert.timestamp).toLocaleString('en-IN')}
        </p>

        <div className="bg-gray-800 rounded-xl p-3 mb-4">
          <p className="text-gray-400 text-xs mb-1">Recommendation</p>
          <p className={`text-sm font-medium ${color.split(' ')[1]}`}>
            {alert.recommendation || 'Monitor situation closely'}
          </p>
        </div>

        {[
          ['Zone', `Zone ${alert.seismic_zone || 'N/A'}`],
          ['Depth', `${alert.depth_km || 'N/A'} km`],
          ['Confidence', `${(alert.confidence * 100).toFixed(0)}%`],
          ['Aftershock Risk', alert.aftershock_probability || 'N/A'],
          ['Affected Radius', alert.affected_radius_km
            ? `${alert.affected_radius_km} km` : 'N/A'],
          ['Source', alert.source || 'USGS'],
        ].map(([label, value]) => (
          <div key={label}
            className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400 text-xs">{label}</span>
            <span className="text-white text-xs font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
