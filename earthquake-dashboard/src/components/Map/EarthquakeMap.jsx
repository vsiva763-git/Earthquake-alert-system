import { MapContainer, TileLayer } from 'react-leaflet'
import { useAlertStore } from '../../store/alertStore'
import { AlertMarker } from './AlertMarker'
import 'leaflet/dist/leaflet.css'

export const EarthquakeMap = () => {
  const alerts = useAlertStore((s) => s.alerts)

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      className="h-96 w-full rounded-xl z-0 shadow-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {alerts.map((alert, i) => (
        <AlertMarker key={`${alert.location}-${i}`} alert={alert} />
      ))}
    </MapContainer>
  )
}
