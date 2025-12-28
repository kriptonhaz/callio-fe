import { useEffect, useRef, useState, useCallback } from 'react'
import JsSIP from 'jssip'
import { useSipCredentials } from './useSipExtensions'

export type SipConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'registered'
  | 'error'

interface UseSipConnectionReturn {
  status: SipConnectionStatus
  connect: () => void
  disconnect: () => void
  isConnected: boolean
  isRegistered: boolean
  error: string | null
}

export function useSipConnection(): UseSipConnectionReturn {
  const { data: sipCredentials } = useSipCredentials()
  const [status, setStatus] = useState<SipConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const uaRef = useRef<JsSIP.UA | null>(null)

  const disconnect = useCallback(() => {
    if (uaRef.current) {
      try {
        uaRef.current.stop()
        uaRef.current = null
        setStatus('disconnected')
        setError(null)
      } catch (err: any) {
        console.error('Failed to disconnect SIP:', err)
        setError(err?.message || 'Failed to disconnect')
      }
    }
  }, [])

  const connect = useCallback(() => {
    if (!sipCredentials) {
      setError('No SIP credentials available')
      return
    }

    // Disconnect if already connected
    if (uaRef.current) {
      disconnect()
    }

    try {
      setStatus('connecting')
      setError(null)

      // Create WebSocket interface
      const socket = new JsSIP.WebSocketInterface(sipCredentials.wsUrl)

      // Build SIP URI: sip:extension@server
      const sipUri = `sip:${sipCredentials.extension}@${sipCredentials.server}`

      // JsSIP configuration - matching working playground setup
      const configuration = {
        sockets: [socket],
        uri: sipUri,
        password: sipCredentials.password,
        authorization_user: sipCredentials.extension, // Use extension as auth user
        register: true,
        registrar_server: `sip:${sipCredentials.server}`, // Explicit registrar server
        session_timers: false,
      }

      // Create User Agent
      const ua = new JsSIP.UA(configuration)

      // Event listeners
      ua.on('connecting', () => {
        console.log('SIP connecting...')
        setStatus('connecting')
      })

      ua.on('connected', () => {
        console.log('SIP connected')
        setStatus('connected')
        setError(null)
      })

      ua.on('disconnected', () => {
        console.log('SIP disconnected')
        setStatus('disconnected')
      })

      ua.on('registered', () => {
        console.log('SIP registered')
        setStatus('registered')
        setError(null)
      })

      ua.on('unregistered', () => {
        console.log('SIP unregistered')
        setStatus('connected')
      })

      ua.on('registrationFailed', (data: any) => {
        console.error('SIP registration failed:', data)
        setStatus('error')
        setError(data?.cause || 'Registration failed')
      })

      // Store UA reference
      uaRef.current = ua

      // Start the UA
      ua.start()
    } catch (err: any) {
      console.error('Failed to initialize SIP:', err)
      setStatus('error')
      setError(err?.message || 'Failed to connect')
    }
  }, [sipCredentials, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    status,
    connect,
    disconnect,
    isConnected: status === 'connected' || status === 'registered',
    isRegistered: status === 'registered',
    error,
  }
}
