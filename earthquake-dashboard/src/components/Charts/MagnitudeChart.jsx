import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAlertStore } from '../../store/alertStore'

export const MagnitudeChart = () => {
  const alerts = useAlertStore((s) => s.alerts)
  const data = alerts
    .slice(0, 20)
    .reverse()
    .map((a, i) => ({
      name: i + 1,
      magnitude: Number(a.predicted_magnitude || a.magnitude || 0)
    }))

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
      <h3 className="text-white font-bold mb-3">📈 Magnitude Trend (Last 20)</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No data to display
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis domain={[0, 8]} stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Line 
              type="monotone" 
              dataKey="magnitude" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              dot={{ fill: '#f59e0b', r: 3 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
