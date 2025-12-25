import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Phone, Edit, AlertCircle } from 'lucide-react'
import {
  useAssignSipRange,
  useClientExtensionRange,
} from '@/hooks/api/useSipRange'
import { toast } from 'sonner'
import type { ClientService } from '@/lib/api/types/services.types'

interface SipExtensionRangeCardProps {
  clientId: string
  services: ClientService[]
  isLoading?: boolean
}

const formSchema = z
  .object({
    rangeStart: z.number().int().min(1, 'Range start must be at least 1'),
    rangeEnd: z.number().int().min(1, 'Range end must be at least 1'),
  })
  .refine((data) => data.rangeEnd >= data.rangeStart, {
    message: 'Range end must be greater than or equal to range start',
    path: ['rangeEnd'],
  })

export function SipExtensionRangeCard({
  clientId,
  services,
  isLoading,
}: SipExtensionRangeCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const assignRangeMutation = useAssignSipRange()

  // Check if VoIP/SIP service is enabled
  // Assuming serviceType 'VOICE' represents VoIP service
  const sipService = services.find((s) => s.serviceType === 'voice')
  const isServiceActive = sipService?.isEnabled ?? false

  // Fetch extension range data only when service is active
  const { data: rangeData, isLoading: isLoadingRange } =
    useClientExtensionRange(clientId, isServiceActive)

  const rangeStart = rangeData?.rangeStart ?? null
  const rangeEnd = rangeData?.rangeEnd ?? null
  const hasRange = rangeData?.hasExtensions ?? false

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rangeStart: rangeStart ?? 1001,
      rangeEnd: rangeEnd ?? 1100,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await assignRangeMutation.mutateAsync({
        clientId,
        ...values,
      })
      toast.success(result.message)
      setDialogOpen(false)
    } catch (error) {
      toast.error('Failed to assign SIP extension range')
    }
  }

  if (isLoading || isLoadingRange) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            SIP Extension Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        className={
          !isServiceActive
            ? 'border-muted bg-muted/20'
            : hasRange
              ? 'border-l-4 border-l-primary'
              : ''
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              SIP Extension Range
            </div>
            {isServiceActive && hasRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  form.reset({
                    rangeStart: rangeStart ?? undefined,
                    rangeEnd: rangeEnd ?? undefined,
                  })
                  setDialogOpen(true)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isServiceActive ? (
            <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  VoIP Service Not Active
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable and activate the VoIP service to configure SIP
                  extension range for this client.
                </p>
              </div>
            </div>
          ) : hasRange ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Range:</span>
                <Badge variant="secondary" className="font-mono">
                  {rangeStart} - {rangeEnd}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-sm font-medium">
                  {rangeEnd! - rangeStart! + 1} extensions
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No SIP extension range assigned to this client.
              </p>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                Set Extension Range
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set/Edit Range Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasRange ? 'Edit' : 'Set'} SIP Extension Range
            </DialogTitle>
            <DialogDescription>
              {hasRange
                ? 'Update the SIP extension range for this client.'
                : 'Assign a range of SIP extensions to this client.'}
              {rangeData?.clientName && (
                <span className="block mt-1 font-medium text-foreground">
                  Client: {rangeData.clientName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="rangeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Range Start</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1001"
                        {...field}
                        type="number"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rangeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Range End</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1100"
                        {...field}
                        type="number"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignRangeMutation.isPending}>
                  {assignRangeMutation.isPending
                    ? 'Assigning...'
                    : hasRange
                      ? 'Update Range'
                      : 'Assign Range'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
