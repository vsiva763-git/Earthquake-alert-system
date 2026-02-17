import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  health: () => axios.get(`${BASE_URL}/health`),
  latestAlerts: () => axios.get(`${BASE_URL}/latest-alerts`),
  liveFeed: () => axios.get(`${BASE_URL}/live-feed`),
  predict: (data) => axios.post(`${BASE_URL}/predict`, data),
  alert: (data) => axios.post(`${BASE_URL}/alert`, data)
}
