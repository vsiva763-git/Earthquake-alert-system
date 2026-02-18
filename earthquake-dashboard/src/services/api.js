import axios from 'axios'

// Auto-detect API URL based on environment
const getBaseURL = () => {
  // If explicitly set in .env and not empty, use it
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && envUrl.trim() !== '') {
    return envUrl
  }
  
  // In Codespaces, construct the URL based on current hostname
  if (window.location.hostname.includes('app.github.dev')) {
    // Extract codespace name from hostname format: {codespaceName}-{port}.app.github.dev
    const match = window.location.hostname.match(/^(.+)-\d+\.app\.github\.dev$/)
    if (match) {
      const codespaceName = match[1]
      return `https://${codespaceName}-8000.app.github.dev`
    }
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
