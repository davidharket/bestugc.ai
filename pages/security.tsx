import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Layout } from '../components/Layout'

interface Session {
  id: string
  sessionToken: string
  expires: string
  lastActivity: string
}

interface SecurityLog {
  id: string
  action: string
  ipAddress: string
  createdAt: string
  details?: string
}

export default function SecurityPage() {
  const { data: session, status } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSecurityData()
    }
  }, [status])

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/auth/sessions')
      const data = await response.json()
      
      if (response.ok) {
        setSessions(data.activeSessions)
        setLogs(data.recentActivity)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error('Error terminating session:', error)
    }
  }

  const terminateAllSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminateAll: true })
      })

      if (response.ok) {
        fetchSecurityData()
      }
    } catch (error) {
      console.error('Error terminating all sessions:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
          <p className="text-gray-400 mt-2">Please sign in to view your security settings.</p>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>Security - Best UGC</title>
        <meta name="description" content="Manage your account security" />
      </Head>
      
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-white mb-8">Security Dashboard</h1>
          
          {/* Active Sessions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Active Sessions</h2>
              <button
                onClick={terminateAllSessions}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Terminate All Other Sessions
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              {sessions.length === 0 ? (
                <p className="text-gray-400">No active sessions found.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Session: {session.sessionToken}</p>
                        <p className="text-gray-400 text-sm">
                          Last activity: {new Date(session.lastActivity).toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Expires: {new Date(session.expires).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                      >
                        Terminate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Security Activity */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Recent Security Activity</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              {logs.length === 0 ? (
                <p className="text-gray-400">No recent activity found.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 border-b border-gray-700 last:border-b-0">
                      <div>
                        <p className="text-white text-sm font-medium">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-gray-400 text-xs">
                          {new Date(log.createdAt).toLocaleString()} • IP: {log.ipAddress}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        log.action.includes('FAILED') || log.action.includes('SUSPICIOUS') 
                          ? 'bg-red-900 text-red-300'
                          : log.action.includes('SUCCESS') || log.action.includes('VERIFIED')
                          ? 'bg-green-900 text-green-300'
                          : 'bg-blue-900 text-blue-300'
                      }`}>
                        {log.action.includes('FAILED') || log.action.includes('SUSPICIOUS') ? 'Warning' :
                         log.action.includes('SUCCESS') || log.action.includes('VERIFIED') ? 'Success' : 'Info'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}