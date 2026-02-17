import { CircleMarker, Popup } from 'react-leaflet'
import { AlertBadge } from '../Alerts/AlertBadge'

const COLORS = { HIGH: '#dc2626', MID: '#f97316', LOW: '#22c55e' }

export const AlertMarker = ({ alert }) => {
  const color = COLORS[alert.alert_level] || '#6b7280'
  const radius = alert.alert_level === 'HIGH' ? 14 : alert.alert_level === 'MID' ? 10 : 7

  return (
    <CircleMarker
      center={[alert.latitude || 20, alert.longitude || 78]}
      radius={radius}
      fillColor={color}
      color={color}
      fillOpacity={0.8}
      weight={2}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-bold text-gray-900">{alert.location || 'Unknown'}</p>
          <p className="text-gray-700">
            Magnitude: <strong>M{Number(alert.predicted_magnitude || alert.magnitude || 0).toFixed(1)}</strong>
          </p>
          <p className="text-gray-700">Depth: {alert.depth_km || 'N/A'} km</p>
          <p className="text-gray-700">Zone: {alert.seismic_zone || 'N/A'}</p>
          {alert.confidence && (
            <p className="text-gray-700">Confidence: {(alert.confidence * 100).toFixed(0)}%</p>
          )}
          <p className="text-gray-500 text-xs mt-1">{alert.timestamp || 'N/A'}</p>
          <div className="mt-2">
            <AlertBadge level={alert.alert_level} />
          </div>
        </div>
      </Popup>
    </CircleMarker>
  )
}
