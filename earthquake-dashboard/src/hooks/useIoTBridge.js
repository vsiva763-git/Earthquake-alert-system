import { useEffect, useRef } from 'react'
import { useAlertStore } from '../store/alertStore'
import { triggerIoTAlert, getIoTStatus } from '../services/iotService'
import toast from 'react-hot-toast'

export const useIoTBridge = (latestAlert) => {
  const { setLastHighAlert, setIotConnected } = useAlertStore()
  const lastAlertIdRef = useRef(null)

  // Check IoT connection every 10 seconds
  useEffect(() => {
    const checkIoT = async () => {
      const status = await getIoTStatus()
      setIotConnected(status.connected)
    }
    checkIoT()
    const interval = setInterval(checkIoT, 10000)
    return () => clearInterval(interval)
  }, [setIotConnected])

  // Auto trigger IoT on HIGH alert (with deduplication)
  useEffect(() => {
    if (!latestAlert) return
    
    const alertId = `${latestAlert.location}-${latestAlert.timestamp}`
    if (alertId === lastAlertIdRef.current) return
    lastAlertIdRef.current = alertId

    if (latestAlert.alert_level === 'HIGH') {
      triggerIoTAlert(latestAlert)
      setLastHighAlert(latestAlert)
      toast.error(
        `🚨 HIGH ALERT — ${latestAlert.location} M${latestAlert.predicted_magnitude}`,
        { duration: 8000, id: alertId }
      )
    } else if (latestAlert.alert_level === 'MID') {
      toast(
        `⚠️  MID ALERT — ${latestAlert.location} M${latestAlert.predicted_magnitude}`,
        { duration: 5000, id: alertId, icon: '⚠️' }
      )
    }
  }, [latestAlert, setLastHighAlert])
}
