import { useAlertStore } from '../../store/alertStore'

export const IoTStatus = () => {
  const { iotConnected, lastHighAlert } = useAlertStore()

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
      <h3 className="text-white font-bold mb-3">📡 IoT Device</h3>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${iotConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-300">
          ESP8266 {iotConnected ? 'Connected' : 'Offline'}
        </span>
      </div>
      {lastHighAlert && (
        <div className="mt-3 p-2 bg-red-900/30 rounded border border-red-700">
          <p className="text-red-400 text-xs font-semibold">Last HIGH Alert:</p>
          <p className="text-red-300 text-xs mt-1">
            {lastHighAlert.location} M{Number(lastHighAlert.predicted_magnitude || lastHighAlert.magnitude || 0).toFixed(1)}
          </p>
          <p className="text-gray-400 text-xs">{lastHighAlert.timestamp}</p>
        </div>
      )}
      {!lastHighAlert && (
        <p className="text-gray-400 text-xs mt-2">No HIGH alerts triggered yet</p>
      )}
    </div>
  )
}
