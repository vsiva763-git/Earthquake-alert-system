import axios from 'axios'

// Auto-detect API URL based on environment
const getBaseURL = () => {
  // If explicitly set in .env, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // In Codespaces, construct the URL based on current hostname
  if (window.location.hostname.includes('app.github.dev')) {
    const codespaceName = window.location.hostname.split('-').slice(0, -1).join('-')
    return `https://${codespaceName}-8000.app.github.dev`
  }
  
  // Default to localhost for local development
  return 'http://localhost:8000'
}

const BASE_URL = getBaseURL()
console.log('🔌 API Base URL:', BASE_URL)

export const api = {
  health: () => axios.get(`${BASE_URL}/health`),
  latestAlerts: () => axios.get(`${BASE_URL}/latest-alerts`),
  liveFeed: () => axios.get(`${BASE_URL}/live-feed`),
  predict: (data) => axios.post(`${BASE_URL}/predict`, data),
  alert: (data) => axios.post(`${BASE_URL}/alert`, data)
}
