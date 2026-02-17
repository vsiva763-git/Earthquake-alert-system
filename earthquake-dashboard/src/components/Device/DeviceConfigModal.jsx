import { useState } from 'react'

export const DeviceConfigModal = ({ device, onSave, onClose }) => {
  const [form, setForm] = useState({ ...device })
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex
                    items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-600 rounded-2xl w-full
                      max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-700 flex justify-between">
          <h2 className="text-white font-bold text-lg">⚙️ Device Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-4">

          <div>
            <label className="text-gray-400 text-xs block mb-1">Device Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg
                         px-3 py-2 text-white text-sm focus:outline-none
                         focus:border-blue-500" />
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg
                         px-3 py-2 text-white text-sm focus:outline-none
                         focus:border-blue-500" />
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">
              IP Address (ESP8266)
            </label>
            <input value={form.ip} onChange={e => set('ip', e.target.value)}
              placeholder="http://192.168.1.100"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg
                         px-3 py-2 text-white text-sm focus:outline-none
                         focus:border-blue-500" />
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">
              Poll Interval (seconds)
            </label>
            <select value={form.pollInterval}
              onChange={e => set('pollInterval', Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg
                         px-3 py-2 text-white text-sm focus:outline-none">
              {[15, 30, 60, 120, 300].map(v => (
                <option key={v} value={v}>{v} seconds</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-xs block mb-1">
              Minimum Alert Level to Trigger Device
            </label>
            <select value={form.alertThreshold}
              onChange={e => set('alertThreshold', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg
                         px-3 py-2 text-white text-sm focus:outline-none">
              <option value="LOW">LOW — trigger on all alerts</option>
              <option value="MID">MID — trigger on MID and HIGH only</option>
              <option value="HIGH">HIGH — trigger on HIGH only</option>
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.buzzerEnabled}
                onChange={e => set('buzzerEnabled', e.target.checked)}
                className="w-4 h-4 accent-blue-500" />
              <span className="text-white text-sm">Buzzer Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.lcdEnabled}
                onChange={e => set('lcdEnabled', e.target.checked)}
                className="w-4 h-4 accent-blue-500" />
              <span className="text-white text-sm">LCD Enabled</span>
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2
                       rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2
                       rounded-lg text-sm font-semibold transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
