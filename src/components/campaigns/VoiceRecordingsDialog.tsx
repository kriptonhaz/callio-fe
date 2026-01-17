import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  useVoiceRecordings,
  useUploadVoiceRecording,
  useDeleteVoiceRecording,
  type VoiceRecording,
} from '@/hooks/api/useVoiceRecordings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Upload,
  Trash2,
  Music,
  Loader2,
  FileAudio,
  Check,
  Phone,
} from 'lucide-react'

interface VoiceRecordingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (recording: VoiceRecording | null) => void
  onCall?: (recording: VoiceRecording) => void
  isDialing?: boolean
  selectedRecordingId?: string
}

export function VoiceRecordingsDialog({
  open,
  onOpenChange,
  onSelect,
  onCall,
  isDialing = false,
  selectedRecordingId,
}: VoiceRecordingsDialogProps): React.ReactElement {
  const { t } = useTranslation()
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: recordings, isLoading } = useVoiceRecordings({ limit: 100 })
  const uploadMutation = useUploadVoiceRecording()
  const deleteMutation = useDeleteVoiceRecording()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!fileName) {
        setFileName(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleUpload = () => {
    if (!selectedFile || !fileName.trim()) {
      toast.error(
        t(
          'voiceRecordings.pleaseSelectFile',
          'Please select a file and enter a name',
        ),
      )
      return
    }

    uploadMutation.mutate(
      {
        file: selectedFile,
        name: fileName.trim(),
        description: fileDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            t(
              'voiceRecordings.uploadSuccess',
              'Recording uploaded successfully',
            ),
          )
          setShowUploadForm(false)
          setFileName('')
          setFileDescription('')
          setSelectedFile(null)
        },
        onError: (error) => {
          toast.error(
            error.message ||
              t('voiceRecordings.uploadFailed', 'Failed to upload recording'),
          )
        },
      },
    )
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success(
          t('voiceRecordings.deleteSuccess', 'Recording deleted successfully'),
        )
        setDeleteId(null)
        if (selectedRecordingId === id) {
          onSelect(null)
        }
      },
      onError: (error) => {
        toast.error(
          error.message ||
            t('voiceRecordings.deleteFailed', 'Failed to delete recording'),
        )
      },
    })
  }

  const handleSelectRecording = (recording: VoiceRecording) => {
    onSelect(recording)
    // Don't close dialog - let user click Call button
  }

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '--'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {t('voiceRecordings.title', 'Voice Recordings')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'voiceRecordings.description',
                'Select a recording to use for the call or upload a new one.',
              )}
            </DialogDescription>
          </DialogHeader>

          {showUploadForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">
                  {t('voiceRecordings.audioFile', 'Audio File')} *
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('voiceRecordings.name', 'Name')} *
                </Label>
                <Input
                  id="name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={t(
                    'voiceRecordings.namePlaceholder',
                    'Enter recording name',
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('voiceRecordings.descriptionLabel', 'Description')}
                </Label>
                <Textarea
                  id="description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder={t(
                    'voiceRecordings.descriptionPlaceholder',
                    'Optional description',
                  )}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(false)
                    setFileName('')
                    setFileDescription('')
                    setSelectedFile(null)
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={
                    uploadMutation.isPending ||
                    !selectedFile ||
                    !fileName.trim()
                  }
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('voiceRecordings.uploading', 'Uploading...')}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {t('voiceRecordings.upload', 'Upload')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[300px] pr-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recordings?.data && recordings.data.length > 0 ? (
                  <div className="space-y-2">
                    {recordings.data.map((recording) => (
                      <div
                        key={recording.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedRecordingId === recording.id
                            ? 'border-primary bg-primary/5'
                            : ''
                        }`}
                        onClick={() => handleSelectRecording(recording)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <FileAudio className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {recording.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDuration(recording.duration)} •{' '}
                              {formatFileSize(recording.fileSize)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedRecordingId === recording.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(recording.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                    <FileAudio className="h-12 w-12 mb-4" />
                    <p className="text-sm">
                      {t('voiceRecordings.noRecordings', 'No recordings yet')}
                    </p>
                  </div>
                )}
              </ScrollArea>

              <DialogFooter>
                {selectedRecordingId && onCall ? (
                  <Button
                    variant="default"
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isDialing}
                    onClick={() => {
                      const recording = recordings?.data?.find(
                        (r) => r.id === selectedRecordingId,
                      )
                      if (recording) {
                        onCall(recording)
                      }
                    }}
                  >
                    {isDialing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    {t('leads.call', 'Call')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onSelect(null)
                      onOpenChange(false)
                    }}
                  >
                    {t('voiceRecordings.useLiveVoice', 'Use Live Voice')}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setShowUploadForm(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('voiceRecordings.uploadNew', 'Upload New')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('voiceRecordings.deleteTitle', 'Delete Recording?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'voiceRecordings.deleteDescription',
                'This action cannot be undone. This will permanently delete the recording.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
