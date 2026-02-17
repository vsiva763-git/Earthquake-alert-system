import { useAlertStore } from '../../store/alertStore'

export const StatCards = () => {
  const alerts = useAlertStore((s) => s.alerts)

  const total = alerts.length
  const highCount = alerts.filter(a => a.alert_level === 'HIGH').length
  const avgMag = alerts.length
    ? (alerts.reduce((sum, a) => sum + Number(a.predicted_magnitude || a.magnitude || 0), 0) / alerts.length).toFixed(2)
    : '—'
  const activeZones = [...new Set(alerts.map(a => a.seismic_zone).filter(Boolean))].length

  const cards = [
    { label: 'Total Alerts', value: total, color: 'text-blue-400' },
    { label: 'HIGH Alerts', value: highCount, color: 'text-red-400' },
    { label: 'Avg Magnitude', value: avgMag, color: 'text-yellow-400' },
    { label: 'Active Zones', value: activeZones, color: 'text-green-400' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
          <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          <p className="text-gray-400 text-sm mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  )
}
