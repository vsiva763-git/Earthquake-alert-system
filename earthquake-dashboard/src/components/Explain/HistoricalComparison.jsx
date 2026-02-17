import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, Cell
} from 'recharts'

export const HistoricalComparison = ({ historical, predicted, alertLevel }) => {
  if (!historical) return null

  const diff = (predicted - historical.avg_magnitude).toFixed(2)
  const isAbove = predicted > historical.avg_magnitude

  const barData = [
    {
      name: 'Historical Avg',
      value: historical.avg_magnitude,
      fill: '#6b7280'
    },
    {
      name: 'Historical Max',
      value: historical.max_magnitude,
      fill: '#4b5563'
    },
    {
      name: 'This Prediction',
      value: predicted,
      fill: alertLevel === 'HIGH' ? '#ef4444'
          : alertLevel === 'MID'  ? '#f97316' : '#22c55e'
    }
  ]

  return (
    <div className="bg-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-bold text-base mb-1">
        📈 Comparison to Historical Average
      </h3>
      <p className="text-gray-400 text-xs mb-4">
        {historical.note}
      </p>

      {/* Callout */}
      <div className={`rounded-xl p-4 mb-5 border
        ${isAbove
          ? 'bg-red-900 border-red-600 text-red-300'
          : 'bg-green-900 border-green-600 text-green-300'}`}>
        <p className="text-sm font-semibold">
          {isAbove
            ? `⚠️ This prediction is M${diff} ABOVE the regional historical average of M${historical.avg_magnitude}`
            : `✅ This prediction is within the normal range — M${Math.abs(diff)} below regional average of M${historical.avg_magnitude}`}
        </p>
        <p className="text-xs mt-1 opacity-75">
          Based on {historical.total_events} historical events
          in this region | Avg depth: {historical.avg_depth} km
        </p>
      </div>

      {/* Bar Comparison Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={barData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis domain={[0, Math.max(historical.max_magnitude, predicted) + 1]}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={v => `M${v}`} />
          <Tooltip
            formatter={(v) => [`M${v}`, 'Magnitude']}
            contentStyle={{ background: '#1f2937', border: 'none',
                            borderRadius: '8px', color: '#fff' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {barData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
