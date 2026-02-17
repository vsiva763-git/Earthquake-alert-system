import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts'

const RISK_COLORS = {
  HIGH:    '#ef4444',
  MED:     '#f97316',
  LOW:     '#22c55e',
  NEUTRAL: '#6b7280'
}

export const FeatureBarChart = ({ features }) => {
  if (!features || features.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-bold text-base mb-1">
          📊 Feature Importance
        </h3>
        <p className="text-gray-500 text-sm mt-4">No feature data available</p>
      </div>
    )
  }
  
  const data = features?.map(f => ({
    name:  f.label,
    value: f.importance_pct,
    risk:  f.risk_level
  })) || []

  return (
    <div className="bg-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-bold text-base mb-1">
        📊 Feature Importance
      </h3>
      <p className="text-gray-400 text-xs mb-4">
        How much each factor contributed to the magnitude prediction (%)
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 20, right: 40 }}
        >
          <XAxis type="number" domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="name" width={160}
            tick={{ fill: '#e5e7eb', fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Contribution']}
            contentStyle={{ background: '#1f2937', border: 'none',
                            borderRadius: '8px', color: '#fff' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            <LabelList dataKey="value" position="right"
              formatter={v => `${v}%`}
              style={{ fill: '#9ca3af', fontSize: 11 }} />
            {data.map((entry, i) => (
              <Cell key={i} fill={RISK_COLORS[entry.risk] || '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-center">
        {[['HIGH Risk Factor','#ef4444'],
          ['MED Risk Factor', '#f97316'],
          ['LOW Risk Factor', '#22c55e']].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full"
                 style={{ background: color }} />
            <span className="text-gray-400 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
