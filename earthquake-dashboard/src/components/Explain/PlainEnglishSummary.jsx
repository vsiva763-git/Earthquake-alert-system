export const PlainEnglishSummary = ({ sentences, alertLevel }) => {
  if (!sentences || sentences.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-bold text-base mb-4">
          💬 Plain English Explanation
        </h3>
        <p className="text-gray-500 text-sm">No explanation available</p>
      </div>
    )
  }
  
  const color = alertLevel === 'HIGH' ? 'border-red-500 text-red-300'
              : alertLevel === 'MID'  ? 'border-orange-500 text-orange-300'
              :                         'border-green-500 text-green-300'
  return (
    <div className="bg-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-bold text-base mb-4">
        💬 Plain English Explanation
      </h3>
      <div className="space-y-3">
        {sentences?.map((sentence, i) => (
          <div key={i}
            className={`border-l-4 ${color} pl-4 py-1`}>
            <p className="text-gray-200 text-sm leading-relaxed">
              {sentence}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
