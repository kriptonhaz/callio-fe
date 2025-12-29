import { create } from 'zustand'

// Declare SIPml global type
declare global {
  interface Window {
    SIPml: any
  }
}

export type SipConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'registered'
  | 'disconnecting'
  | 'error'

export type CallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'active'
  | 'ended'
  | 'failed'

interface SipCredentials {
  extension: string
  password: string
  server: string
  wsUrl: string
}

interface SipStore {
  // Connection State
  status: SipConnectionStatus
  error: string | null
  sipStack: any | null
  registerSession: any | null
  disconnectTimeout: NodeJS.Timeout | null
  sipmlReady: boolean

  // Call State
  callStatus: CallStatus
  callSession: any | null
  remoteAudio: HTMLAudioElement | null
  ringbackAudio: HTMLAudioElement | null

  // Connection Actions
  initSipml: () => void
  connect: (credentials: SipCredentials) => void
  disconnect: () => void
  setStatus: (status: SipConnectionStatus) => void
  setError: (error: string | null) => void
  setSipmlReady: (ready: boolean) => void

  // Call Actions
  makeCall: (destinationNumber: string, server: string) => void
  hangup: () => void
  setCallStatus: (status: CallStatus) => void
}

export const useSipStore = create<SipStore>((set, get) => ({
  // Initial connection state
  status: 'disconnected',
  error: null,
  sipStack: null,
  registerSession: null,
  disconnectTimeout: null,
  sipmlReady: false,

  // Initial call state
  callStatus: 'idle',
  callSession: null,
  remoteAudio: null,
  ringbackAudio: null,

  // Connection Actions
  setStatus: (status) => set({ status }),

  setError: (error) => set({ error }),

  setSipmlReady: (ready) => set({ sipmlReady: ready }),

  initSipml: () => {
    if (typeof window === 'undefined') return

    if (window.SIPml) {
      window.SIPml.setDebugLevel('info')
      window.SIPml.init(
        () => {
          console.log('SIPml is ready')
          set({ sipmlReady: true })
        },
        (e: any) => {
          console.error('SIPml initialization failed', e)
          set({ error: 'SIPml Init Failed', sipmlReady: false })
        },
      )
    } else {
      console.error('SIPml library not found!')
      set({ error: 'SIPml Library Missing', sipmlReady: false })
    }
  },

  disconnect: () => {
    const { sipStack, callSession, disconnectTimeout } = get()

    // Hangup any active call first
    if (callSession) {
      try {
        callSession.hangup()
      } catch (e) {
        console.error('Error terminating call:', e)
      }
      set({ callSession: null, callStatus: 'idle' })
    }

    if (sipStack) {
      try {
        set({ status: 'disconnecting', error: null })

        // Clear any existing timeout
        if (disconnectTimeout) {
          clearTimeout(disconnectTimeout)
        }

        sipStack.stop()

        // Add a small delay to ensure clean disconnect
        const timeout = setTimeout(() => {
          set({
            status: 'disconnected',
            sipStack: null,
            registerSession: null,
            disconnectTimeout: null,
          })
        }, 500)

        set({ disconnectTimeout: timeout })
      } catch (err: any) {
        console.error('Failed to disconnect SIP:', err)
        set({
          status: 'error',
          error: err?.message || 'Failed to disconnect',
          sipStack: null,
        })
      }
    }
  },

  connect: (credentials) => {
    const { sipStack, disconnect, sipmlReady } = get()

    if (!sipmlReady) {
      console.error('SIPml is not ready yet')
      set({ error: 'SIPml not initialized' })
      return
    }

    if (!window.SIPml) {
      console.error('SIPml library not found!')
      set({ error: 'SIPml Library Missing' })
      return
    }

    // Disconnect if already connected
    if (sipStack) {
      disconnect()
    }

    try {
      set({ status: 'connecting', error: null })

      // Build SIP URI
      const publicIdentity = `sip:${credentials.extension}@${credentials.server}`

      // Create audio elements for remote audio and ringback
      let remoteAudio = get().remoteAudio
      if (!remoteAudio) {
        remoteAudio = new Audio()
        remoteAudio.autoplay = true
        set({ remoteAudio })
      }

      let ringbackAudio = get().ringbackAudio
      if (!ringbackAudio) {
        ringbackAudio = new Audio(
          'https://www.doubango.org/sipml5/sounds/ringback.wav',
        )
        ringbackAudio.loop = true
        set({ ringbackAudio })
      }

      // Event handler for stack events
      const onStackEventListener = (e: any) => {
        console.log('SIPml Stack Event:', e.type)
        const { sipStack: currentStack } = get()

        switch (e.type) {
          case 'started':
            set({ status: 'connected', error: null })
            console.log('SIP Stack Started. Registering...')

            // Register automatically after connection
            if (currentStack) {
              const regSession = currentStack.newSession('register', {
                expires: 200,
                events_listener: {
                  events: '*',
                  listener: onRegisterEventListener,
                },
                sip_caps: [
                  { name: '+g.oma.sip-im', value: null },
                  { name: '+audio', value: null },
                  { name: 'language', value: '"en"' },
                ],
              })
              regSession.register()
              set({ registerSession: regSession })
            }
            break

          case 'stopping':
          case 'stopped':
          case 'failed_to_start':
          case 'failed_to_stop':
            set({
              status: 'disconnected',
              error: e.description || null,
              sipStack: null,
              registerSession: null,
            })
            break

          case 'i_new_call': {
            // Incoming Call - reject if busy or accept logic can be added here
            const { callSession: existingCall } = get()
            if (existingCall) {
              // Busy - reject the call
              e.newSession.hangup()
            } else {
              // Handle incoming call - for now just log it
              console.log(
                'Incoming call from:',
                e.newSession?.getRemoteFriendlyName(),
              )
              // Could set up incoming call handling here
            }
            break
          }

          default:
            break
        }
      }

      const onRegisterEventListener = (e: any) => {
        console.log('SIPml Register Event:', e.type)
        switch (e.type) {
          case 'connected':
            set({ status: 'registered', error: null })
            console.log('SIP Registered successfully')
            break
          case 'terminated':
            set({ status: 'connected', error: null })
            console.log('SIP Unregistered')
            break
        }
      }

      // Create SIP Stack
      const newStack = new window.SIPml.Stack({
        realm: credentials.server,
        impi: credentials.extension, // Private Identity (IMPI) is the Authorization Username
        impu: publicIdentity, // Public Identity (IMPU) is the SIP URI
        password: credentials.password,
        display_name: credentials.extension,
        websocket_proxy_url: credentials.wsUrl,
        outbound_proxy_url: null,
        ice_servers: [],
        enable_rtcweb_breaker: false,
        events_listener: { events: '*', listener: onStackEventListener },
        enable_early_ims: false,
        enable_media_stream_cache: true,
        bandwidth: { audio: 64, video: 512 },
        sip_headers: [
          {
            name: 'User-Agent',
            value: 'Callio-WebPhone/1.0.0 sipML5-v1.2016.03.04',
          },
        ],
      })

      // Store stack and start
      set({ sipStack: newStack })
      newStack.start()
    } catch (err: any) {
      console.error('Failed to initialize SIP:', err)
      set({
        status: 'error',
        error: err?.message || 'Failed to connect',
        sipStack: null,
      })
    }
  },

  // Call Actions
  setCallStatus: (callStatus) => set({ callStatus }),

  makeCall: (destinationNumber: string, _server: string) => {
    const { sipStack, status, callSession, remoteAudio, ringbackAudio } = get()

    if (!sipStack || status !== 'registered') {
      console.error('Cannot make call: not registered')
      set({ error: 'Not registered to SIP server' })
      return
    }

    if (callSession) {
      console.error('Cannot make call: another call is active')
      set({ error: 'Another call is already active' })
      return
    }

    try {
      set({ callStatus: 'calling', error: null })

      // Helper functions for ringback
      const startRingback = () => {
        ringbackAudio?.play().catch((e) => console.log('Audio play blocked', e))
      }
      const stopRingback = () => {
        ringbackAudio?.pause()
        if (ringbackAudio) ringbackAudio.currentTime = 0
      }

      // Event handler for call events
      const onCallEventListener = (e: any) => {
        console.log('SIPml Call Event:', e.type)
        switch (e.type) {
          case 'connecting':
          case 'connected':
            set({ callStatus: 'active' })
            stopRingback()
            console.log('Call connected')
            break

          case 'terminating':
          case 'terminated':
            set({ callStatus: 'ended', callSession: null })
            stopRingback()
            console.log('Call terminated')
            // Reset to idle after a delay
            setTimeout(() => set({ callStatus: 'idle' }), 1000)
            break

          case 'i_ao_request':
            // Audio Output Request - call is ringing
            set({ callStatus: 'ringing' })
            startRingback()
            console.log('Call ringing...')
            break

          default:
            break
        }
      }

      // Call configuration
      const callConfig = {
        audio_remote: remoteAudio,
        video_local: null,
        video_remote: null,
        screencast_window_id: 0x00000000,
        bandwidth: { audio: undefined, video: undefined },
        video_size: {
          minWidth: undefined,
          minHeight: undefined,
          maxWidth: undefined,
          maxHeight: undefined,
        },
        events_listener: { events: '*', listener: onCallEventListener },
        sip_caps: [
          { name: '+g.oma.sip-im' },
          { name: 'language', value: '"en"' },
        ],
      }

      // Create Outgoing Call Session
      const newCallSession = sipStack.newSession('call-audio', callConfig)

      if (newCallSession) {
        const ret = newCallSession.call(destinationNumber)
        if (ret !== 0) {
          set({
            callStatus: 'failed',
            callSession: null,
            error: 'Call Failed to Start',
          })
          // Reset to idle after a delay
          setTimeout(() => set({ callStatus: 'idle' }), 2000)
        } else {
          set({ callSession: newCallSession })
          console.log('Call initiated to:', destinationNumber)
        }
      }
    } catch (err: any) {
      console.error('Failed to make call:', err)
      set({
        callStatus: 'failed',
        error: err?.message || 'Failed to make call',
        callSession: null,
      })
      // Reset to idle after a delay
      setTimeout(() => set({ callStatus: 'idle' }), 2000)
    }
  },

  hangup: () => {
    const { callSession, ringbackAudio } = get()

    // Stop ringback
    ringbackAudio?.pause()
    if (ringbackAudio) ringbackAudio.currentTime = 0

    if (callSession) {
      try {
        callSession.hangup()
        console.log('Call terminated')
      } catch (err: any) {
        console.error('Failed to hangup:', err)
      }
      set({ callSession: null, callStatus: 'idle' })
    }
  },
}))

// Selector helpers for computed values
export const selectIsConnected = (state: SipStore) =>
  state.status === 'connected' || state.status === 'registered'

export const selectIsRegistered = (state: SipStore) =>
  state.status === 'registered'

export const selectIsCallActive = (state: SipStore) =>
  state.callStatus === 'active' ||
  state.callStatus === 'ringing' ||
  state.callStatus === 'calling'
