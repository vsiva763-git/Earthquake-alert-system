import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAlertStore } from '../store/alertStore'

export const useLatestAlerts = () => {
  const setAlerts = useAlertStore((s) => s.setAlerts)

  return useQuery({
    queryKey: ['latest-alerts'],
    queryFn: async () => {
      console.log('🔄 Fetching latest alerts...')
      try {
        const res = await api.latestAlerts()
        console.log('✅ Alerts received:', res.data.length, 'alerts')
        setAlerts(res.data)
        return res.data
      } catch (error) {
        console.error('❌ Failed to fetch alerts:', error.message)
        if (error.response) {
          console.error('Response status:', error.response.status)
          console.error('Response data:', error.response.data)
        } else if (error.request) {
          console.error('No response received. Check if backend URL is accessible.')
        }
        throw error
      }
    },
    refetchInterval: 30000,   // poll every 30 seconds
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
