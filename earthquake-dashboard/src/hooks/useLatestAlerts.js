import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAlertStore } from '../store/alertStore'

export const useLatestAlerts = () => {
  const setAlerts = useAlertStore((s) => s.setAlerts)

  return useQuery({
    queryKey: ['latest-alerts'],
    queryFn: async () => {
      const res = await api.latestAlerts()
      setAlerts(res.data)
      return res.data
    },
    refetchInterval: 30000,   // poll every 30 seconds
    refetchOnWindowFocus: true,
    retry: 3
  })
}
