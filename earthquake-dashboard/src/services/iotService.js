import axios from 'axios'

const IOT_IP = import.meta.env.VITE_IOT_IP || 'http://192.168.1.100'

export const triggerIoTAlert = async (alertData) => {
  try {
    await axios.post(`${IOT_IP}/alert`, {
      level: alertData.alert_level,
      magnitude: alertData.predicted_magnitude,
      location: alertData.location,
      timestamp: alertData.timestamp
    }, { timeout: 5000 })
    console.log('✓ IoT alert sent successfully')
    return true
  } catch (err) {
    console.error('✗ IoT trigger failed:', err.message)
    return false
  }
}

export const getIoTStatus = async () => {
  try {
    const res = await axios.get(`${IOT_IP}/status`, { timeout: 3000 })
    return { connected: true, ...res.data }
  } catch {
    return { connected: false }
  }
}
