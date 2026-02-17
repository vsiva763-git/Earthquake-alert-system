const RISK_BADGE = {
  HIGH:    'bg-red-700 text-red-100',
  MED:     'bg-orange-700 text-orange-100',
  LOW:     'bg-green-800 text-green-100',
  NEUTRAL: 'bg-gray-700 text-gray-300'
}

export const RiskFactorTable = ({ features }) => {
  if (!features || features.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-bold text-base mb-4">
          📋 Risk Factor Breakdown
        </h3>
        <p className="text-gray-500 text-sm">No risk factor data available</p>
      </div>
    )
  }
  
  return (
  <div className="bg-gray-800 rounded-2xl p-5">
    <h3 className="text-white font-bold text-base mb-4">
      📋 Risk Factor Breakdown
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
            <th className="text-left pb-2 pr-4">Feature</th>
            <th className="text-right pb-2 pr-4">Actual Value</th>
            <th className="text-right pb-2 pr-4">Contribution</th>
            <th className="text-right pb-2">Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {features?.map((f, i) => (
            <tr key={i}
              className="border-b border-gray-700 hover:bg-gray-750">
              <td className="py-2.5 pr-4 text-white font-medium">
                {f.label}
              </td>
              <td className="py-2.5 pr-4 text-right text-yellow-400 font-mono">
                {f.actual_value !== null && f.actual_value !== undefined
                  ? typeof f.actual_value === 'number'
                    ? f.actual_value % 1 === 0
                      ? f.actual_value
                      : f.actual_value.toFixed(2)
                    : f.actual_value
                  : '—'}
              </td>
              <td className="py-2.5 pr-4 text-right text-blue-400 font-semibold">
                {f.importance_pct}%
              </td>
              <td className="py-2.5 text-right">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                  ${RISK_BADGE[f.risk_level] || RISK_BADGE.NEUTRAL}`}>
                  {f.risk_level}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  )
}
