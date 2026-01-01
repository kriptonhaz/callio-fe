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
  FormDescription,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Globe, Edit, AlertCircle, Plus } from 'lucide-react'
import {
  useClientIpWhitelist,
  useUpdateIpWhitelist,
} from '@/hooks/api/useIpWhitelist'
import { toast } from 'sonner'
import type { ClientService } from '@/lib/api/types/services.types'
import { useTranslation } from 'react-i18next'

interface IpWhitelistCardProps {
  clientId: string
  services: ClientService[]
  isLoading?: boolean
}

// Validate IP address format (IPv4)
const ipAddressRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

const formSchema = z.object({
  ipAddresses: z
    .string()
    .min(1, 'At least one IP address is required')
    .refine(
      (value) => {
        const ips = value
          .split(/[\n,]/)
          .map((ip) => ip.trim())
          .filter((ip) => ip.length > 0)
        return ips.every((ip) => ipAddressRegex.test(ip))
      },
      {
        message:
          'Invalid IP address format. Enter valid IPv4 addresses separated by commas or new lines.',
      },
    ),
})

export function IpWhitelistCard({
  clientId,
  services,
  isLoading,
}: IpWhitelistCardProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const updateIpWhitelistMutation = useUpdateIpWhitelist()

  // Check if SMS service is enabled
  const smsService = services.find((s) => s.serviceType === 'sms')
  const isServiceActive = smsService?.isEnabled ?? false

  // Fetch IP whitelist data only when SMS service is active
  const { data: whitelistData, isLoading: isLoadingWhitelist } =
    useClientIpWhitelist(clientId, isServiceActive)

  const ipList = whitelistData?.ipWhitelist
    ? whitelistData.ipWhitelist.split(',').map((ip) => ip.trim())
    : []
  const hasIps = ipList.length > 0

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ipAddresses: whitelistData?.ipWhitelist ?? '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Normalize IPs: split by comma or newline, trim, filter empty, join with comma
      const normalizedIps = values.ipAddresses
        .split(/[\n,]/)
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0)
        .join(',')

      await updateIpWhitelistMutation.mutateAsync({
        clientId,
        data: { ipWhitelist: normalizedIps },
      })
      toast.success(
        t(
          'clients.ipWhitelist.updateSuccess',
          'IP Whitelist updated successfully',
        ),
      )
      setDialogOpen(false)
    } catch {
      toast.error(
        t('clients.ipWhitelist.updateError', 'Failed to update IP Whitelist'),
      )
    }
  }

  if (isLoading || isLoadingWhitelist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('clients.ipWhitelist.title', 'IP Whitelist')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </div>
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
            : hasIps
              ? 'border-l-4 border-l-primary'
              : ''
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('clients.ipWhitelist.title', 'IP Whitelist')}
            </div>
            {isServiceActive && hasIps && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  form.reset({
                    ipAddresses: whitelistData?.ipWhitelist ?? '',
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
                  {t(
                    'clients.ipWhitelist.smsNotActive',
                    'SMS Service Not Active',
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    'clients.ipWhitelist.smsNotActiveDescription',
                    'Enable and activate the SMS service to configure IP whitelist for this client.',
                  )}
                </p>
              </div>
            </div>
          ) : hasIps ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('clients.ipWhitelist.whitelistedIps', 'Whitelisted IPs')}:
                </span>
                <span className="text-sm font-medium">{ipList.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ipList.map((ip, index) => (
                  <Badge key={index} variant="secondary" className="font-mono">
                    {ip}
                  </Badge>
                ))}
              </div>
              {whitelistData?.apiAccessEnabled && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" className="bg-green-600">
                    {t('clients.ipWhitelist.apiEnabled', 'API Access Enabled')}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(
                      'clients.ipWhitelist.noIps',
                      'No IP addresses whitelisted',
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      'clients.ipWhitelist.noIpsDescription',
                      'Add IP addresses to allow the client to access the SMS API directly from their servers.',
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  form.reset({ ipAddresses: '' })
                  setDialogOpen(true)
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('clients.ipWhitelist.addIps', 'Add IP Addresses')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit IP Whitelist Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasIps
                ? t('clients.ipWhitelist.editTitle', 'Edit IP Whitelist')
                : t('clients.ipWhitelist.addTitle', 'Add IP Whitelist')}
            </DialogTitle>
            <DialogDescription>
              {hasIps
                ? t(
                    'clients.ipWhitelist.editDescription',
                    'Update the whitelisted IP addresses for this client.',
                  )
                : t(
                    'clients.ipWhitelist.addDescription',
                    'Add IP addresses to allow direct API access for this client.',
                  )}
              {whitelistData?.clientName && (
                <span className="block mt-1 font-medium text-foreground">
                  {t('common.client', 'Client')}: {whitelistData.clientName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="ipAddresses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('clients.ipWhitelist.ipAddresses', 'IP Addresses')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="192.168.1.1&#10;10.0.0.1&#10;203.0.113.50"
                        className="font-mono min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'clients.ipWhitelist.ipAddressesHelp',
                        'Enter IP addresses separated by commas or new lines. Only IPv4 addresses are supported.',
                      )}
                    </FormDescription>
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
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateIpWhitelistMutation.isPending}
                >
                  {updateIpWhitelistMutation.isPending
                    ? t('common.saving', 'Saving...')
                    : hasIps
                      ? t('common.update', 'Update')
                      : t('common.add', 'Add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
