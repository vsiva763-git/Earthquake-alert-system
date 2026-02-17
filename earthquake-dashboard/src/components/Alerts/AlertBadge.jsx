export const AlertBadge = ({ level }) => {
  const styles = {
    HIGH: 'bg-red-600 text-white animate-pulse',
    MID: 'bg-orange-400 text-white',
    LOW: 'bg-green-500 text-white'
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[level] || 'bg-gray-500 text-white'}`}>
      {level}
    </span>
  )
}
