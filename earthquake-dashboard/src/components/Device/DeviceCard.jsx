const STATUS_STYLES = {
  online:  { dot: 'bg-green-400', text: 'text-green-400', label: 'Online' },
  offline: { dot: 'bg-red-500',   text: 'text-red-400',   label: 'Offline' },
  unknown: { dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-400', label: 'Checking...' }
}

export const DeviceCard = ({
  device, pinging, onPing, onTestAlert, onConfigure, onRemove
}) => {
  const s = STATUS_STYLES[device.status] || STATUS_STYLES.unknown

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">

      {/* Device Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-bold text-base">{device.name}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{device.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
          <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
        </div>
      </div>

      {/* Device Info */}
      <div className="space-y-2 mb-4">
        {[
          ['IP Address', device.ip],
          ['Poll Interval', `${device.pollInterval}s`],
          ['Alert Threshold', device.alertThreshold],
          ['Buzzer', device.buzzerEnabled ? 'Enabled' : 'Disabled'],
          ['LCD Display', device.lcdEnabled ? 'Enabled' : 'Disabled'],
          ['Last Seen', device.lastSeen
            ? new Date(device.lastSeen).toLocaleTimeString('en-IN')
            : 'Never'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-400 text-xs">{label}</span>
            <span className="text-white text-xs font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Test Alert Buttons */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2">Send Test Alert:</p>
        <div className="flex gap-2">
          {['LOW', 'MID', 'HIGH'].map(level => (
            <button key={level}
              onClick={() => onTestAlert(level)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors
                ${level === 'HIGH' ? 'bg-red-700 hover:bg-red-600 text-white'
                : level === 'MID'  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                :                    'bg-green-700 hover:bg-green-600 text-white'}`}>
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={onPing} disabled={pinging}
          className="flex-1 bg-blue-700 hover:bg-blue-600 text-white py-2
                     rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
          {pinging ? '⏳ Pinging...' : '📶 Ping'}
        </button>
        <button onClick={onConfigure}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2
                     rounded-lg text-xs font-semibold transition-colors">
          ⚙️ Config
        </button>
        <button onClick={onRemove}
          className="bg-red-900 hover:bg-red-800 text-red-400 py-2 px-3
                     rounded-lg text-xs font-semibold transition-colors">
          🗑️
        </button>
      </div>
    </div>
  )
}
