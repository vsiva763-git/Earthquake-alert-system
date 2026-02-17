import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { DeviceCard } from '../components/Device/DeviceCard'
import { DeviceConfigModal } from '../components/Device/DeviceConfigModal'

const DEFAULT_DEVICES = [
  {
    id: 'esp01',
    name: 'ESP8266 — Lab Unit 1',
    ip: import.meta.env.VITE_IOT_IP || 'http://192.168.1.100',
    location: 'Microwave Lab, FXEC',
    status: 'unknown',
    lastSeen: null,
    buzzerEnabled: true,
    lcdEnabled: true,
    alertThreshold: 'LOW',
    pollInterval: 30,
  }
]

export const DeviceManagement = () => {
  const [devices, setDevices] = useState(DEFAULT_DEVICES)
  const [configDevice, setConfigDevice] = useState(null)
  const [pinging, setPinging] = useState({})

  // Ping all devices on load
  useEffect(() => {
    devices.forEach(d => pingDevice(d))
  }, [])

  const pingDevice = async (device) => {
    setPinging(p => ({ ...p, [device.id]: true }))
    try {
      const res = await axios.get(`${device.ip}/status`, { timeout: 4000 })
      setDevices(prev => prev.map(d =>
        d.id === device.id
          ? { ...d, status: 'online', lastSeen: new Date().toISOString(),
              ...res.data }
          : d
      ))
    } catch {
      setDevices(prev => prev.map(d =>
        d.id === device.id ? { ...d, status: 'offline' } : d
      ))
    }
    setPinging(p => ({ ...p, [device.id]: false }))
  }

  const sendTestAlert = async (device, level) => {
    try {
      await axios.post(`${device.ip}/alert`, {
        level,
        magnitude: level === 'HIGH' ? 6.0 : level === 'MID' ? 4.5 : 2.5,
        location: 'TEST ALERT',
        timestamp: new Date().toISOString()
      })
      toast.success(`${level} test alert sent to ${device.name}`)
    } catch {
      toast.error(`Failed to reach ${device.name} — check IP and WiFi`)
    }
  }

  const addDevice = () => {
    const newDevice = {
      id: `esp${Date.now()}`,
      name: `ESP8266 — Unit ${devices.length + 1}`,
      ip: 'http://192.168.1.101',
      location: 'New Location',
      status: 'unknown',
      lastSeen: null,
      buzzerEnabled: true,
      lcdEnabled: true,
      alertThreshold: 'LOW',
      pollInterval: 30,
    }
    setDevices([...devices, newDevice])
    setConfigDevice(newDevice)
  }

  const updateDevice = (updated) => {
    setDevices(prev => prev.map(d => d.id === updated.id ? updated : d))
    setConfigDevice(null)
    toast.success('Device configuration saved')
  }

  const removeDevice = (id) => {
    setDevices(prev => prev.filter(d => d.id !== id))
    toast('Device removed', { icon: '🗑️' })
  }

  const onlineCount = devices.filter(d => d.status === 'online').length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">
            📡 Device Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {onlineCount}/{devices.length} devices online
          </p>
        </div>
        <button onClick={addDevice}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2
                     rounded-lg text-sm font-semibold transition-colors">
          + Add Device
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Devices', value: devices.length, color: 'text-blue-400' },
          { label: 'Online', value: onlineCount, color: 'text-green-400' },
          { label: 'Offline', value: devices.filter(d => d.status === 'offline').length, color: 'text-red-400' },
          { label: 'Unknown', value: devices.filter(d => d.status === 'unknown').length, color: 'text-yellow-400' },
        ].map((c, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-gray-400 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            pinging={pinging[device.id]}
            onPing={() => pingDevice(device)}
            onTestAlert={(level) => sendTestAlert(device, level)}
            onConfigure={() => setConfigDevice(device)}
            onRemove={() => removeDevice(device.id)}
          />
        ))}
      </div>

      {/* Config Modal */}
      {configDevice && (
        <DeviceConfigModal
          device={configDevice}
          onSave={updateDevice}
          onClose={() => setConfigDevice(null)}
        />
      )}
    </div>
  )
}
