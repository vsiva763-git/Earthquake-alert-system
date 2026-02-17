import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAlertStore } from '../../store/alertStore'

const COLORS = { LOW: '#22c55e', MID: '#f97316', HIGH: '#dc2626' }

export const AlertPieChart = () => {
  const alerts = useAlertStore((s) => s.alerts)

  const counts = alerts.reduce((acc, a) => {
    acc[a.alert_level] = (acc[a.alert_level] || 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
      <h3 className="text-white font-bold mb-3">🥧 Alert Distribution</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No data to display
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie 
              data={data} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" 
              cy="50%" 
              outerRadius={70}
              label
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
