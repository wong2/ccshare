import { useState, useEffect } from 'react'
import { SessionRenderer } from './components'
import type { Session } from './types'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/session.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load session')
        return res.json()
      })
      .then((data) => {
        setSession(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading session...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">No session data</div>
      </div>
    )
  }

  return <SessionRenderer session={session} />
}

export default App
