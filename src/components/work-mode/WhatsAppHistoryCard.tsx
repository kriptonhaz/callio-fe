import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ChevronDown,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { ChatMessageBubble } from './ChatMessageBubble'
import type { Lead } from '@/lib/api/types/leads.types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  useWhatsAppInstances,
  useWhatsAppMessages,
} from '@/hooks/api/useWhatsapp'
import { phoneToJid } from '@/lib/whatsapp/phone-to-jid'
import { cn } from '@/lib/utils'

interface Props {
  lead: Lead | null | undefined
}

export function WhatsAppHistoryCard({ lead }: Props) {
  const [open, setOpen] = useState(false)

  // Collapse when the lead changes so the next agent starts from a clean card.
  useEffect(() => {
    setOpen(false)
  }, [lead?.id])

  if (!lead?.phone) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors flex-row items-center justify-between gap-3 space-y-0 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">WhatsApp History</span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                open && 'rotate-180',
              )}
            />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {/* Mounted only while open so the 3s poll doesn't run when collapsed */}
          <HistoryContent phone={lead.phone} />
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function HistoryContent({ phone }: { phone: string }) {
  const { data: instances, isLoading: instancesLoading } =
    useWhatsAppInstances()

  const connected = useMemo(
    () => (instances ?? []).filter((i) => i.status === 'connected'),
    [instances],
  )

  const [instanceId, setInstanceId] = useState<string>('')

  // Pick a default instance when the list arrives.
  useEffect(() => {
    if (!instanceId && connected.length > 0) {
      setInstanceId(connected[0].id)
    }
  }, [connected, instanceId])

  const remoteJid = useMemo(() => phoneToJid(phone), [phone])

  const {
    data: messages,
    isLoading: messagesLoading,
    isSuccess,
  } = useWhatsAppMessages(instanceId, remoteJid)

  const sorted = useMemo(
    () =>
      [...(messages ?? [])].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  )

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const didInitialScrollRef = useRef(false)
  const lastCountRef = useRef(0)
  const [showNewHint, setShowNewHint] = useState(false)

  // Auto-scroll to bottom only on first successful render.
  useLayoutEffect(() => {
    if (!didInitialScrollRef.current && isSuccess && sorted.length > 0) {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
      didInitialScrollRef.current = true
      lastCountRef.current = sorted.length
    }
  }, [isSuccess, sorted.length])

  // On new messages after the initial scroll, only auto-scroll if the user is
  // already near the bottom. Otherwise show a "new message" hint.
  useEffect(() => {
    if (!didInitialScrollRef.current) return
    if (sorted.length <= lastCountRef.current) return
    const el = scrollRef.current
    lastCountRef.current = sorted.length
    if (!el) return
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) {
      el.scrollTop = el.scrollHeight
    } else {
      setShowNewHint(true)
    }
  }, [sorted.length])

  const handleScrollDown = () => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
    setShowNewHint(false)
  }

  // Empty-state branches
  if (instancesLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (connected.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground border-t">
        No connected WhatsApp instance. Contact admin to set one up.
      </div>
    )
  }

  return (
    <div className="border-t">
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Instance</span>
        {connected.length > 1 ? (
          <Select value={instanceId} onValueChange={setInstanceId}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {connected.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                  <span className="text-muted-foreground ml-2">
                    {i.phoneNumber}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs font-medium truncate">
            {connected[0]?.name}
            <span className="text-muted-foreground ml-1.5 font-normal">
              {connected[0]?.phoneNumber}
            </span>
          </span>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="max-h-[320px] overflow-y-auto px-3 py-3 flex flex-col gap-2"
        >
          {messagesLoading && sorted.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No WhatsApp conversation yet.
            </div>
          ) : (
            <>
              {sorted.map((m) => (
                <ChatMessageBubble key={m.id} message={m} />
              ))}
              <div className="flex justify-center pt-1">
                <Badge variant="secondary" className="text-[10px] h-5">
                  {sorted.length} message{sorted.length === 1 ? '' : 's'}
                </Badge>
              </div>
            </>
          )}
        </div>

        {showNewHint && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 gap-1 shadow-md"
              onClick={handleScrollDown}
            >
              <ChevronDown className="h-3.5 w-3.5" />
              New message
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
