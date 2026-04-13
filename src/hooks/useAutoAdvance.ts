import { useCallback, useEffect, useRef, useState } from 'react'
import type { VoipSettings } from '@/lib/api/types/voip-settings.types'
import type { LastCallStatus } from '@/lib/api/types/lead-assignments.types'

interface Prerequisites {
  campaignHasVoip: boolean
  sipRegistered: boolean
  agentPlacedCall: boolean
}

interface AutoAdvanceParams {
  settings: VoipSettings | undefined
  prerequisites: Prerequisites
  currentIndex: number
  isLastLead: boolean
  /**
   * Current assignment's lastCallStatus. Hook re-reads this on every render
   * and uses it when the grace window resolves.
   */
  getCurrentStatus: () => LastCallStatus | null | undefined
  /**
   * Incremented by the caller every time a call ends (SIP ended, or recording
   * poll's activeCall → null). Starts the auto-advance evaluation.
   */
  callEndedSignal: number
  /**
   * Moves to the next lead (typically setCurrentIndex(i + 1)).
   */
  onAdvance: () => void
  /**
   * Called (after a short debounce) on the new current lead if settings.autoAdvanceLiveCall is on.
   */
  onAutoDial?: () => void
}

export interface AutoAdvanceState {
  secondsLeft: number | null
  totalSeconds: number
  cancel: () => void
}

const GRACE_WINDOW_MS = 3000

export function useAutoAdvance({
  settings,
  prerequisites,
  currentIndex,
  isLastLead,
  getCurrentStatus,
  callEndedSignal,
  onAdvance,
  onAutoDial,
}: AutoAdvanceParams): AutoAdvanceState {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const graceTimerRef = useRef<number | null>(null)
  const advancedFromIndexRef = useRef<number | null>(null)

  // Keep onAutoDial closure fresh; the post-advance timeout fires after the
  // new lead has loaded, so it must read the latest render's closure.
  const onAutoDialRef = useRef(onAutoDial)
  useEffect(() => {
    onAutoDialRef.current = onAutoDial
  }, [onAutoDial])

  const getCurrentStatusRef = useRef(getCurrentStatus)
  useEffect(() => {
    getCurrentStatusRef.current = getCurrentStatus
  }, [getCurrentStatus])

  const onAdvanceRef = useRef(onAdvance)
  useEffect(() => {
    onAdvanceRef.current = onAdvance
  }, [onAdvance])

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    if (graceTimerRef.current !== null) {
      window.clearTimeout(graceTimerRef.current)
      graceTimerRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    clearTimers()
    setSecondsLeft(null)
  }, [clearTimers])

  // Cancel countdown if we move between leads for any reason.
  useEffect(() => {
    cancel()
  }, [currentIndex, cancel])

  // Unmount cleanup.
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  // React to call-ended signal.
  useEffect(() => {
    if (callEndedSignal === 0) return
    if (!settings?.autoAdvanceEnabled) return
    if (!prerequisites.campaignHasVoip) return
    if (!prerequisites.sipRegistered) return
    if (!prerequisites.agentPlacedCall) return
    if (isLastLead) return
    if (settings.autoAdvanceStatuses.length === 0) return

    // Grace window: wait for backend to populate lastCallStatus.
    const startedForIndex = currentIndex
    const statuses = new Set(settings.autoAdvanceStatuses)

    const evaluateAndStart = (status: LastCallStatus | null | undefined) => {
      if (!status) return false
      if (!statuses.has(status)) return false
      // Start countdown.
      const total = Math.max(1, Math.min(60, settings.autoAdvanceDelaySec))
      setSecondsLeft(total)
      countdownTimerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null) return prev
          if (prev <= 1) {
            clearTimers()
            advancedFromIndexRef.current = startedForIndex
            onAdvanceRef.current()
            return null
          }
          return prev - 1
        })
      }, 1000)
      return true
    }

    const now = getCurrentStatusRef.current()
    if (evaluateAndStart(now)) return

    const startedAt = Date.now()
    const tick = () => {
      if (Date.now() - startedAt >= GRACE_WINDOW_MS) {
        graceTimerRef.current = null
        return
      }
      const s = getCurrentStatusRef.current()
      if (evaluateAndStart(s)) {
        graceTimerRef.current = null
        return
      }
      graceTimerRef.current = window.setTimeout(tick, 500)
    }
    graceTimerRef.current = window.setTimeout(tick, 500)

    return () => {
      // callEndedSignal changed or deps changed — cleanup is in `clearTimers`
      // called from other effects; explicit clear for safety.
      if (graceTimerRef.current !== null) {
        window.clearTimeout(graceTimerRef.current)
        graceTimerRef.current = null
      }
    }

  }, [callEndedSignal])

  // Auto-dial after advance, when currentIndex changes to (advancedFrom + 1).
  useEffect(() => {
    const from = advancedFromIndexRef.current
    if (from === null) return
    if (currentIndex !== from + 1) return
    advancedFromIndexRef.current = null

    if (!settings?.autoAdvanceLiveCall) return
    if (!prerequisites.campaignHasVoip) return
    if (!prerequisites.sipRegistered) return

    const t = window.setTimeout(() => onAutoDialRef.current?.(), 800)
    return () => window.clearTimeout(t)

  }, [currentIndex])

  return {
    secondsLeft,
    totalSeconds: settings?.autoAdvanceDelaySec ?? 5,
    cancel,
  }
}
