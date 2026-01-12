import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Send,
  ArrowLeft,
  UserPlus,
  Check,
  CheckCheck,
  Loader2,
  Users,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  MessageCircle,
  User,
} from 'lucide-react'
import { RoleGuard } from '@/lib/auth-guard'
import { cn } from '@/lib/utils'
import {
  useWhatsAppChats,
  useWhatsAppMessages,
  useSendMessage,
  useWhatsAppInstances,
  useMarkMessageAsRead,
  useUploadMedia,
} from '@/hooks/api/useWhatsapp'
import { toast } from 'sonner'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

export const Route = createFileRoute('/dashboard/whatsapp/details/$instanceId')(
  {
    component: WhatsAppDetailsPage,
  },
)

function WhatsAppDetailsPage(): React.ReactElement {
  const { t } = useTranslation()
  const { instanceId } = Route.useParams()
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [previewMedia, setPreviewMedia] = useState<{
    url: string
    type: 'image' | 'video'
  } | null>(null)

  // File attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // zoomLevel moved to ImagePreviewDialog
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch instances to get current instance phone number
  const { data: instances } = useWhatsAppInstances()
  const currentInstance = instances?.find((i) => i.id === instanceId)

  // Fetch chat list
  const { data: chats, isLoading: isChatsLoading } =
    useWhatsAppChats(instanceId)

  // Filter out own number from chat list
  const filteredChats = chats?.filter((chat) => {
    if (!currentInstance?.phoneNumber) return true
    // Extract phone number from jid (e.g., "6285881732869@s.whatsapp.net" -> "6285881732869")
    const chatPhoneNumber = chat.jid.split('@')[0]
    return chatPhoneNumber !== currentInstance.phoneNumber
  })

  // Fetch messages for selected chat
  const { data: messages, isLoading: isMessagesLoading } = useWhatsAppMessages(
    instanceId,
    selectedChat,
  )

  const sendMessageMutation = useSendMessage()
  const markAsReadMutation = useMarkMessageAsRead()
  const uploadMediaMutation = useUploadMedia()

  const selectedChatData = filteredChats?.find((c) => c.jid === selectedChat)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const clearFileSelection = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (): Promise<void> => {
    if ((!message.trim() && !selectedFile) || !selectedChat) return

    try {
      let mediaUrl: string | undefined
      let messageType: 'text' | 'image' | 'video' | 'audio' | 'document' =
        'text'

      // Handle file upload if present
      if (selectedFile) {
        const result = await uploadMediaMutation.mutateAsync({
          instanceId,
          file: selectedFile,
        })
        mediaUrl = result.mediaUrl

        // Determine message type
        if (selectedFile.type.startsWith('image/')) {
          messageType = 'image'
        } else if (selectedFile.type.startsWith('video/')) {
          messageType = 'video'
        } else if (selectedFile.type.startsWith('audio/')) {
          messageType = 'audio'
        } else {
          messageType = 'document'
        }
      }

      // Send the message
      sendMessageMutation.mutate(
        {
          instanceId,
          to: selectedChat,
          content: message.trim() || (selectedFile ? selectedFile.name : ''),
          messageType,
          mediaUrl,
        },
        {
          onSuccess: () => {
            setMessage('')
            clearFileSelection()
          },
          onError: () => {
            toast.error(t('whatsapp.sendError', 'Failed to send message'))
          },
        },
      )
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(t('whatsapp.uploadError', 'Failed to upload media'))
    }
  }

  // Sort messages by createdAt
  const sortedMessages = useMemo(
    () =>
      messages
        ? [...messages].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
        : [],
    [messages],
  )

  // Build participant lookup from messages (senderJid -> senderName)
  const participantLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    if (messages) {
      for (const msg of messages) {
        if (msg.senderJid && msg.senderName) {
          // Store with the raw ID (without @lid or @s.whatsapp.net)
          const id = msg.senderJid.split('@')[0]
          if (!lookup.has(id)) {
            lookup.set(id, msg.senderName)
          }
        }
      }
    }
    return lookup
  }, [messages])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [sortedMessages, selectedChat, isMessagesLoading])

  return (
    <RoleGuard allowedRoles={['admin', 'supervisor', 'agent']}>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link to="/dashboard/whatsapp">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {t('whatsapp.chats', 'Chats')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {currentInstance?.name || instanceId}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Chat List Panel - Full width on mobile, hidden when chat selected on mobile */}
          <Card
            className={cn(
              'flex flex-col h-full overflow-hidden p-0 gap-0',
              'w-full md:w-80 md:shrink-0',
              selectedChat ? 'hidden md:flex' : 'flex',
            )}
          >
            <CardContent className="p-0 flex flex-col h-full">
              {/* Search & Actions */}
              <div className="p-3 border-b flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t(
                      'whatsapp.searchChats',
                      'Search or start new chat',
                    )}
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="icon">
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat List */}
              <ScrollArea className="flex-1 min-h-0">
                {isChatsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="divide-y">
                    {!filteredChats || filteredChats.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        {t('whatsapp.noChats', 'No conversations yet')}
                      </div>
                    ) : (
                      filteredChats
                        .filter((chat) =>
                          chat.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                        )
                        .map((chat) => (
                          <button
                            key={chat.id}
                            type="button"
                            className={cn(
                              'w-full p-3 grid grid-cols-[auto_1fr] gap-3 hover:bg-muted/50 transition-colors text-left overflow-hidden items-center',
                              selectedChat === chat.jid && 'bg-muted',
                            )}
                            onClick={() => {
                              setSelectedChat(chat.jid)
                              if (chat.unreadCount > 0) {
                                markAsReadMutation.mutate({
                                  instanceId,
                                  jid: chat.jid,
                                })
                              }
                            }}
                          >
                            <Avatar>
                              <AvatarImage src={chat.profilePicUrl || ''} />
                              <AvatarFallback>
                                {chat.isGroup ? (
                                  <Users className="h-4 w-4" />
                                ) : (
                                  chat.name.slice(0, 2).toUpperCase()
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">
                                  {chat.name || formatJid(chat.jid)}
                                </span>
                                {chat.lastMessage && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(chat.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 w-full">
                                <p className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                                  {chat.lastMessage?.content || ''}
                                </p>
                                {chat.unreadCount > 0 && (
                                  <Badge
                                    variant="default"
                                    className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs shrink-0"
                                  >
                                    {chat.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Conversation Panel - Full width on mobile, hidden when no chat selected on mobile */}
          <Card
            className={cn(
              'flex-1 flex flex-col min-w-0 overflow-hidden p-0 gap-0',
              'w-full md:w-auto',
              selectedChat ? 'flex' : 'hidden md:flex',
            )}
          >
            {selectedChat && selectedChatData ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedChat(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedChatData.profilePicUrl || ''} />
                      <AvatarFallback>
                        {selectedChatData.isGroup ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          selectedChatData.name.slice(0, 2).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedChatData.name ||
                          formatJid(selectedChatData.jid)}
                      </h3>
                      {selectedChatData.isGroup && (
                        <span className="text-sm text-muted-foreground">
                          {t('whatsapp.group', 'Group')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 min-h-0 p-4">
                  {isMessagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {/* Messages */}
                      {sortedMessages.map((msg, index) => {
                        const isOutbound = msg.direction === 'outbound'
                        const prevMsg =
                          index > 0 ? sortedMessages[index - 1] : null
                        const isSameSender =
                          prevMsg &&
                          prevMsg.direction === msg.direction &&
                          (isOutbound || prevMsg.senderJid === msg.senderJid)

                        // Check if we need to show date separator
                        const showDateSeparator =
                          !prevMsg ||
                          new Date(msg.createdAt).toDateString() !==
                            new Date(prevMsg.createdAt).toDateString()

                        return (
                          <div key={msg.id}>
                            {showDateSeparator && (
                              <div className="flex justify-center my-4">
                                <Badge variant="secondary" className="px-4">
                                  {new Date(msg.createdAt).toLocaleDateString(
                                    undefined,
                                    {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    },
                                  )}
                                </Badge>
                              </div>
                            )}

                            <div
                              className={cn(
                                'flex gap-2',
                                isOutbound ? 'justify-end' : 'justify-start',
                                isSameSender ? 'mt-1' : 'mt-4',
                              )}
                            >
                              {!isOutbound && (
                                <Avatar
                                  className={cn(
                                    'h-8 w-8 shrink-0 mt-0.5',
                                    isSameSender && 'opacity-0',
                                  )}
                                >
                                  <AvatarImage
                                    src={msg.senderProfilePicUrl || undefined}
                                  />
                                  <AvatarFallback>
                                    {(msg.senderName || '?')
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <div
                                className={cn(
                                  'flex flex-col max-w-[70%]',
                                  isOutbound ? 'items-end' : 'items-start',
                                )}
                              >
                                {/* Sender Name for Inbound Group Messages */}
                                {selectedChatData?.isGroup &&
                                  !isOutbound &&
                                  !isSameSender && (
                                    <span className="text-xs text-muted-foreground ml-1 mb-1 px-1">
                                      {msg.senderName ||
                                        formatJid(msg.senderJid || '')}
                                    </span>
                                  )}

                                <div
                                  className={cn(
                                    'px-4 py-2 shadow-sm',
                                    isOutbound
                                      ? 'bg-primary text-primary-foreground rounded-l-lg rounded-tr-lg'
                                      : 'bg-muted rounded-r-lg rounded-tl-lg',
                                    isSameSender &&
                                      isOutbound &&
                                      'rounded-br-lg',
                                    isSameSender &&
                                      !isOutbound &&
                                      'rounded-bl-lg',
                                    !isSameSender &&
                                      isOutbound &&
                                      'rounded-br-none',
                                    !isSameSender &&
                                      !isOutbound &&
                                      'rounded-bl-none',
                                  )}
                                >
                                  {msg.messageType === 'image' &&
                                    msg.mediaUrl && (
                                      <div className="mb-2 rounded overflow-hidden">
                                        <img
                                          src={`${import.meta.env.VITE_MEDIA_BASE_URL}${msg.mediaUrl}`}
                                          alt={msg.content || 'Image'}
                                          className="max-w-[240px] max-h-[240px] w-auto h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => {
                                            setPreviewMedia({
                                              url: `${import.meta.env.VITE_MEDIA_BASE_URL}${msg.mediaUrl}`,
                                              type: 'image',
                                            })
                                          }}
                                        />
                                      </div>
                                    )}
                                  {msg.messageType === 'video' &&
                                    msg.mediaUrl && (
                                      <div className="mb-2 rounded overflow-hidden relative group max-w-[240px]">
                                        <video
                                          src={`${import.meta.env.VITE_MEDIA_BASE_URL}${msg.mediaUrl}`}
                                          className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity max-h-[300px]"
                                          onClick={() => {
                                            setPreviewMedia({
                                              url: `${import.meta.env.VITE_MEDIA_BASE_URL}${msg.mediaUrl}`,
                                              type: 'video',
                                            })
                                          }}
                                        />
                                        <div
                                          className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors cursor-pointer pointer-events-none"
                                          onClick={() => {
                                            setPreviewMedia({
                                              url: `${import.meta.env.VITE_MEDIA_BASE_URL}${msg.mediaUrl}`,
                                              type: 'video',
                                            })
                                          }}
                                        >
                                          <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                            <div className="h-0 w-0 border-y-[8px] border-y-transparent border-l-[16px] border-l-white ml-1" />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  {msg.content &&
                                    msg.content !== '[Video]' &&
                                    msg.content !== '[Image]' &&
                                    msg.messageType !== 'sticker' && (
                                      <MessageWithMentions
                                        content={msg.content}
                                        participantLookup={participantLookup}
                                        onStartChat={(jid: string) => {
                                          // Switch to the individual chat with this person
                                          setSelectedChat(jid)
                                        }}
                                        isOutbound={isOutbound}
                                      />
                                    )}
                                  {msg.messageType === 'document' &&
                                    msg.mediaUrl && (
                                      <div
                                        className={cn(
                                          'flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-black/5 transition-colors mb-2',
                                          isOutbound
                                            ? 'bg-primary-foreground/10'
                                            : 'bg-black/5',
                                        )}
                                        onClick={() =>
                                          window.open(
                                            `${import.meta.env.VITE_MEDIA_BASE_URL}${msg.mediaUrl}`,
                                            '_blank',
                                          )
                                        }
                                      >
                                        <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center shrink-0">
                                          <FileText className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium truncate">
                                            {msg.content || 'Document'}
                                          </p>
                                          <p className="text-xs opacity-70">
                                            PDF • Click to open
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  {msg.messageType === 'sticker' &&
                                    msg.mediaUrl && (
                                      <div className="mb-2">
                                        <img
                                          src={`${import.meta.env.VITE_MEDIA_BASE_URL}${msg.mediaUrl}`}
                                          alt="Sticker"
                                          className="w-32 h-auto object-contain select-none"
                                          draggable={false}
                                        />
                                      </div>
                                    )}
                                  <div
                                    className={cn(
                                      'flex items-center justify-end gap-1 mt-1 select-none',
                                      isOutbound
                                        ? 'text-primary-foreground/70'
                                        : 'text-muted-foreground',
                                    )}
                                  >
                                    <span className="text-[10px] leading-none">
                                      {formatTime(msg.createdAt)}
                                    </span>
                                    {isOutbound && (
                                      <>
                                        {msg.status === 'read' ? (
                                          <CheckCheck className="h-3 w-3" />
                                        ) : msg.status === 'delivered' ? (
                                          <CheckCheck className="h-3 w-3" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* File Preview */}
                {selectedFile && (
                  <div className="px-4 py-2 bg-background border-t flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      {filePreview ? (
                        <div className="relative h-12 w-12 rounded overflow-hidden border">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : selectedFile.type.startsWith('video/') ? (
                        <div className="h-12 w-12 bg-black rounded flex items-center justify-center border overflow-hidden">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center border">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={clearFileSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-3 border-t flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          sendMessageMutation.isPending ||
                          uploadMediaMutation.isPending
                        }
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="start"
                      className="w-full p-0 border-none shadow-none bg-transparent"
                    >
                      <EmojiPicker
                        onEmojiClick={(emojiData: EmojiClickData) => {
                          setMessage((prev) => prev + emojiData.emoji)
                        }}
                        width="100%"
                        height={400} // WhatsApp mobile style height
                        previewConfig={{ showPreview: false }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      sendMessageMutation.isPending ||
                      uploadMediaMutation.isPending
                    }
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder={t('whatsapp.typeMessage', 'Type a message')}
                    className="flex-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={
                      sendMessageMutation.isPending ||
                      uploadMediaMutation.isPending
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={
                      sendMessageMutation.isPending ||
                      uploadMediaMutation.isPending ||
                      (!message.trim() && !selectedFile)
                    }
                  >
                    {sendMessageMutation.isPending ||
                    uploadMediaMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>
                  {t('whatsapp.selectChat', 'Select a chat to start messaging')}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Media Preview Dialog */}
        <MediaPreviewDialog
          media={previewMedia}
          open={!!previewMedia}
          onClose={() => setPreviewMedia(null)}
        />
      </div>
    </RoleGuard>
  )
}

function MediaPreviewDialog({
  media,
  open,
  onClose,
}: {
  media: { url: string; type: 'image' | 'video' } | null
  open: boolean
  onClose: () => void
}) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null)

  const imgRef = useRef<HTMLImageElement>(null)

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setZoomLevel(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [open, media])

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const newZoom = Math.min(Math.max(prev + delta, 0.5), 5)
      return newZoom
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (media?.type === 'video') return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    setIsDragging(true)
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // To properly implement pinch without libraries, we need the initial scale at touch start
  // Let's refine the touch start:
  const lastScale = useRef(1)

  const onTouchStart = (e: React.TouchEvent) => {
    if (media?.type === 'video') return
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      setInitialPinchDist(dist)
      lastScale.current = zoomLevel
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (media?.type === 'video') return
    // Prevent default to stop scrolling/zooming page
    // Note: e.preventDefault() might not work in passive listeners (default in React 18+)
    // We handle this with CSS touch-action: none

    if (e.touches.length === 2 && initialPinchDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const newScale = lastScale.current * (dist / initialPinchDist)
      setZoomLevel(Math.min(Math.max(newScale, 0.5), 5))
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }

  const onTouchEnd = () => {
    setIsDragging(false)
    setInitialPinchDist(null)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-screen-xl w-full h-[90vh] bg-transparent border-none p-0 flex flex-col shadow-none"
      >
        {/* Header Tools */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {media?.type === 'image' && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={() => handleZoom(0.5)}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={() => handleZoom(-0.5)}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={() => {
                  setZoomLevel(1)
                  setPosition({ x: 0, y: 0 })
                }}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 overflow-hidden relative flex items-center justify-center cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: 'none' }}
        >
          {media?.url &&
            (media.type === 'image' ? (
              <img
                ref={imgRef}
                src={media.url}
                alt="Preview"
                className="max-w-full max-h-full transition-transform duration-100 ease-out select-none pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                }}
                draggable={false}
              />
            ) : (
              <video
                src={media.url}
                className="max-w-full max-h-full outline-none"
                controls
                autoPlay
                playsInline
                style={{ cursor: 'default' }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to format JID to readable name
function formatJid(jid: string): string {
  // Remove @g.us for group chats or @s.whatsapp.net for individual
  if (jid.includes('@g.us')) {
    return `Group ${jid.split('@')[0].slice(-6)}`
  }
  if (jid.includes('@lid')) {
    return jid.split('@')[0]
  }
  return jid.split('@')[0]
}

// Helper function to format timestamp
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Component to render message content with clickable mentions
function MessageWithMentions({
  content,
  participantLookup,
  onStartChat,
  isOutbound,
}: {
  content: string
  participantLookup: Map<string, string>
  onStartChat: (jid: string) => void
  isOutbound: boolean
}): React.ReactElement {
  // Parse @mentions in content - matches @followed by digits
  const mentionRegex = /@(\d+)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    const mentionId = match[1]
    const displayName =
      participantLookup.get(mentionId) || formatPhoneNumber(mentionId)
    const jid = `${mentionId}@s.whatsapp.net`

    parts.push(
      <Popover key={`mention-${match.index}`}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'font-medium underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity',
              isOutbound ? 'text-primary-foreground' : 'text-primary',
            )}
          >
            @{displayName}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground">{mentionId}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => onStartChat(jid)}
            >
              <MessageCircle className="h-4 w-4" />
              Send Message
            </Button>
          </div>
        </PopoverContent>
      </Popover>,
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  // If no mentions found, just return the content as-is
  if (parts.length === 0) {
    parts.push(content)
  }

  return <p className="text-sm whitespace-pre-wrap break-words">{parts}</p>
}

// Helper to format phone number for display
function formatPhoneNumber(phone: string): string {
  // Basic formatting - just return as-is with country code hint
  if (phone.length > 10) {
    return `+${phone.slice(0, 2)} ${phone.slice(2)}`
  }
  return phone
}
