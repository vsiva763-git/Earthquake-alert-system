import { useEffect, useState } from 'react'
import { api } from '../../services/api'

export const ApiStatus = () => {
  const [status, setStatus] = useState({ connected: false, checking: true })
  const [apiUrl, setApiUrl] = useState('')

  useEffect(() => {
    // Get the API URL from the api service
    const getApiUrl = () => {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
      }
      if (window.location.hostname.includes('app.github.dev')) {
        const codespaceName = window.location.hostname.split('-').slice(0, -1).join('-')
        return `https://${codespaceName}-8000.app.github.dev`
      }
      return 'http://localhost:8000'
    }

    const url = getApiUrl()
    setApiUrl(url)

    const checkConnection = async () => {
      try {
        await api.health()
        setStatus({ connected: true, checking: false })
      } catch (error) {
        console.error('API health check failed:', error)
        setStatus({ connected: false, checking: false, error: error.message })
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 10000)
    return () => clearInterval(interval)
  }, [])

  if (status.checking) {
    return (
      <div className="text-xs text-gray-400">
        <span className="animate-pulse">Checking API...</span>
      </div>
    )
  }

  return (
    <div className="text-xs">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
        <span className={status.connected ? 'text-green-400' : 'text-red-400'}>
          API {status.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="text-gray-500 mt-1" title={apiUrl}>
        {apiUrl.length > 40 ? `${apiUrl.substring(0, 37)}...` : apiUrl}
      </div>
      {status.error && (
        <div className="text-red-400 text-xs mt-1">
          {status.error}
        </div>
      )}
    </div>
  )
}
