import { create } from 'zustand'
import JsSIP from 'jssip'

export type SipConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'registered'
  | 'disconnecting'
  | 'error'

interface SipCredentials {
  extension: string
  password: string
  server: string
  wsUrl: string
}

interface SipStore {
  // State
  status: SipConnectionStatus
  error: string | null
  ua: JsSIP.UA | null
  disconnectTimeout: NodeJS.Timeout | null

  // Actions
  connect: (credentials: SipCredentials) => void
  disconnect: () => void
  setStatus: (status: SipConnectionStatus) => void
  setError: (error: string | null) => void
}

export const useSipStore = create<SipStore>((set, get) => ({
  // Initial state
  status: 'disconnected',
  error: null,
  ua: null,
  disconnectTimeout: null,

  // Actions
  setStatus: (status) => set({ status }),

  setError: (error) => set({ error }),

  disconnect: () => {
    const { ua, disconnectTimeout } = get()

    if (ua) {
      try {
        set({ status: 'disconnecting', error: null })

        // Clear any existing timeout
        if (disconnectTimeout) {
          clearTimeout(disconnectTimeout)
        }

        ua.stop()

        // Add a small delay to ensure clean disconnect
        const timeout = setTimeout(() => {
          set({ status: 'disconnected', ua: null, disconnectTimeout: null })
        }, 500)

        set({ disconnectTimeout: timeout })
      } catch (err: any) {
        console.error('Failed to disconnect SIP:', err)
        set({
          status: 'error',
          error: err?.message || 'Failed to disconnect',
          ua: null,
        })
      }
    }
  },

  connect: (credentials) => {
    const { ua, disconnect } = get()

    // Disconnect if already connected
    if (ua) {
      disconnect()
    }

    try {
      set({ status: 'connecting', error: null })

      // Create WebSocket interface
      const socket = new JsSIP.WebSocketInterface(credentials.wsUrl)

      // Build SIP URI
      const sipUri = `sip:${credentials.extension}@${credentials.server}`

      // JsSIP configuration
      const configuration = {
        sockets: [socket],
        uri: sipUri,
        password: credentials.password,
        authorization_user: credentials.extension,
        register: true,
        registrar_server: `sip:${credentials.server}`,
        session_timers: false,
      }

      // Create User Agent
      const newUa = new JsSIP.UA(configuration)

      // Event listeners
      newUa.on('connecting', () => {
        console.log('SIP connecting...')
        set({ status: 'connecting' })
      })

      newUa.on('connected', () => {
        console.log('SIP connected')
        set({ status: 'connected', error: null })
      })

      newUa.on('disconnected', () => {
        console.log('SIP disconnected')
        set({ status: 'disconnected' })
      })

      newUa.on('registered', () => {
        console.log('SIP registered')
        set({ status: 'registered', error: null })
      })

      newUa.on('unregistered', () => {
        console.log('SIP unregistered')
        set({ status: 'connected' })
      })

      newUa.on('registrationFailed', (data: any) => {
        console.error('SIP registration failed:', data)
        set({
          status: 'error',
          error: data?.cause || 'Registration failed',
        })
      })

      // Store UA and start
      set({ ua: newUa })
      newUa.start()
    } catch (err: any) {
      console.error('Failed to initialize SIP:', err)
      set({
        status: 'error',
        error: err?.message || 'Failed to connect',
        ua: null,
      })
    }
  },
}))

// Selector helpers for computed values
export const selectIsConnected = (state: SipStore) =>
  state.status === 'connected' || state.status === 'registered'

export const selectIsRegistered = (state: SipStore) =>
  state.status === 'registered'
