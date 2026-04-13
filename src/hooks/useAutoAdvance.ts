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

const GRACE_WINDOW_MS = 30000

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
    const why: string[] = []
    if (!settings?.autoAdvanceEnabled) why.push('settings.autoAdvanceEnabled=false')
    if (!prerequisites.campaignHasVoip) why.push('campaignHasVoip=false')
    if (!prerequisites.sipRegistered) why.push('sipRegistered=false')
    if (!prerequisites.agentPlacedCall) why.push('agentPlacedCall=false')
    if (isLastLead) why.push('isLastLead=true')
    if (settings && settings.autoAdvanceStatuses.length === 0)
      why.push('autoAdvanceStatuses=[]')
    if (why.length > 0) {
      console.debug('[auto-advance] skipped:', why.join(', '))
      return
    }
    if (!settings) return

    // Grace window: wait for backend to populate lastCallStatus.
    const startedForIndex = currentIndex
    const statuses = new Set(settings.autoAdvanceStatuses)

    const evaluateAndStart = (status: LastCallStatus | null | undefined) => {
      if (!status) return false
      if (!statuses.has(status)) {
        console.debug(
          `[auto-advance] status "${status}" not in configured list`,
          Array.from(statuses),
        )
        return false
      }
      console.debug(`[auto-advance] starting countdown for status "${status}"`)
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
      const elapsed = Date.now() - startedAt
      if (elapsed >= GRACE_WINDOW_MS) {
        console.debug(
          `[auto-advance] grace window expired after ${Math.round(elapsed / 1000)}s without a matching status. Last read:`,
          getCurrentStatusRef.current(),
        )
        graceTimerRef.current = null
        return
      }
      const s = getCurrentStatusRef.current()
      console.debug(
        `[auto-advance] polling @ ${Math.round(elapsed / 1000)}s, status=`,
        s,
      )
      if (evaluateAndStart(s)) {
        graceTimerRef.current = null
        return
      }
      graceTimerRef.current = window.setTimeout(tick, 1000)
    }
    graceTimerRef.current = window.setTimeout(tick, 1000)

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
