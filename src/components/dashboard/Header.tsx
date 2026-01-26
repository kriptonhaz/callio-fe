import { useTranslation } from 'react-i18next'
import { Moon } from '@/components/animate-ui/icons/moon'
import { NotificationsPopover } from './NotificationsPopover'
import { Sun } from '@/components/animate-ui/icons/sun'
import { Globe } from '@/components/animate-ui/icons/globe'
import { AnimateIcon } from '@/components/animate-ui/icons/icon'
import { Button } from '@/components/ui/button'
import { useSipConnectionStatus } from '@/hooks/api/useSipConnectionStatus'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useEffect, useState, useRef } from 'react'
import { useSipCredentials } from '@/hooks/api/useSipExtensions'
import { useSipStore } from '@/store/useSipStore'
import { useHeaderStore } from '@/store/useHeaderStore'

import rangcoolLogo from '@/assets/images/rangcool-logo.png'

export function Header(): React.ReactElement {
  const { i18n } = useTranslation()
  const customContent = useHeaderStore((state) => state.customContent)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Check localStorage first, then fall back to dark theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      // Default to dark theme
      setTheme('dark')
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10">
      {customContent ? (
        <div className="flex-1 min-w-0 mr-4">{customContent}</div>
      ) : (
        <>
          {/* Mobile logo - visible only on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <img
              src={rangcoolLogo}
              alt="RangCool"
              className="h-8 w-auto object-contain"
            />
            <span className="font-bold text-xl text-primary tracking-tight">
              RangCool
            </span>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />
        </>
      )}

      <div className="flex items-center space-x-4">
        <VoipConnectionButton />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <AnimateIcon animateOnHover asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </Button>
            </AnimateIcon>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('id')}>
              Bahasa Indonesia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AnimateIcon animateOnHover asChild>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </AnimateIcon>

        <NotificationsPopover />
      </div>
    </header>
  )
}

function VoipConnectionButton() {
  const { t } = useTranslation()
  const { data: sipCredentials } = useSipCredentials()
  const status = useSipStore((state) => state.status)
  const connect = useSipStore((state) => state.connect)
  const disconnect = useSipStore((state) => state.disconnect)
  const error = useSipStore((state) => state.error)
  const initSipml = useSipStore((state) => state.initSipml)
  const sipmlReady = useSipStore((state) => state.sipmlReady)
  const { data: backendStatus, isLoading: isCheckingBackend } =
    useSipConnectionStatus(status === 'connected' || status === 'registered')

  const isLocalConnected = status === 'connected' || status === 'registered'

  // Connected only if BOTH local and backend agree (or while checking backend if local is just connected)
  const isConnected = isLocalConnected && (backendStatus?.connected ?? false)

  const [actionInProgress, setActionInProgress] = useState(false)
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize SIPml when component mounts
  useEffect(() => {
    initSipml()
  }, [initSipml])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current)
      }
    }
  }, [])

  // Reset actionInProgress when status changes significantly
  useEffect(() => {
    if (status === 'registered' || status === 'disconnected') {
      setActionInProgress(false)
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current)
        actionTimeoutRef.current = null
      }
    }
  }, [status])

  // Don't show button if user doesn't have SIP credentials
  if (!sipCredentials) {
    return null
  }

  const handleToggleConnection = async () => {
    if (isTransitioning) return

    setActionInProgress(true)
    // Safety timeout to reset spinner if something gets stuck
    actionTimeoutRef.current = setTimeout(() => {
      setActionInProgress(false)
    }, 10000)

    try {
      if (isConnected || isLocalConnected) {
        disconnect()
      } else {
        if (!sipCredentials) {
          console.error('No SIP credentials found')
          setActionInProgress(false)
          return
        }
        connect(sipCredentials)
      }
    } catch (error) {
      console.error('Connection toggle error:', error)
      setActionInProgress(false)
    }
  }

  const isConnecting = status === 'connecting'
  const isDisconnecting = status === 'disconnecting'

  const isTransitioning =
    isConnecting ||
    isDisconnecting ||
    actionInProgress ||
    !sipmlReady ||
    isCheckingBackend

  let statusText = t('voip.disconnected', 'Disconnected')
  let statusColor = 'bg-red-500'

  if (isDisconnecting) {
    statusText = t('voip.disconnecting', 'Disconnecting...')
    statusColor = 'bg-yellow-500'
  } else if (isConnecting) {
    statusText = t('voip.connecting', 'Connecting...')
    statusColor = 'bg-yellow-500'
  } else if (isLocalConnected) {
    if (backendStatus?.connected) {
      statusText = t('voip.connected', 'Connected')
      statusColor = 'bg-green-500'
    } else {
      // Local connected but backend not yet (or failed)
      statusText = t('voip.syncing', 'Syncing...')
      statusColor = 'bg-yellow-500'
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 h-9"
      onClick={handleToggleConnection}
      disabled={isTransitioning}
      title={error || undefined}
    >
      {/* Status indicator circle */}
      <div
        className={`w-2 h-2 rounded-full ${statusColor} ${
          isTransitioning ? 'animate-pulse' : ''
        }`}
      />
      {/* Extension number */}
      <span className="text-sm font-medium">
        {t('voip.ext', 'Ext')}: {sipCredentials.extension}
      </span>
      {/* Connection status text */}
      <span className="text-xs text-muted-foreground">{statusText}</span>
    </Button>
  )
}
