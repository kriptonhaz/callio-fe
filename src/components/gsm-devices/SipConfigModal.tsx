import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSipConfig, useUpdateSipConfig } from '@/hooks/api/useGsmDevices'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import type { SipConfigFormData } from '@/lib/api/types/sip-config.types'

interface SipConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
  portNumber: number
}

const sipConfigSchema = z.object({
  authId: z.string().min(1, 'Authentication ID is required'),
  authPassword: z.string().min(1, 'Password is required'),
  gwPrefix: z.string().min(1, 'Routing Prefix is required'),
  proxy: z.string().min(1, 'SIP Proxy is required'),
  registrar: z.string().min(1, 'SIP Registrar Server is required'),
  registerExpired: z.number().min(1, 'Re-register Period must be at least 1'),
  phoneNumber: z.string(),
  displayName: z.string().min(1, 'Display Name is required'),
  outboundProxy: z.string(),
  homeDomain: z.string(),
})

export function SipConfigModal({
  open,
  onOpenChange,
  deviceId,
  portNumber,
}: SipConfigModalProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)

  const { data: sipConfig, isLoading } = useSipConfig(
    deviceId,
    portNumber,
    open,
  )
  const { mutate: updateSipConfig, isPending: isUpdating } =
    useUpdateSipConfig()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SipConfigFormData>({
    resolver: zodResolver(sipConfigSchema),
    defaultValues: {
      authId: '',
      authPassword: '',
      gwPrefix: '',
      proxy: '',
      registrar: '',
      registerExpired: 60,
      phoneNumber: '',
      displayName: '',
      outboundProxy: '',
      homeDomain: '',
    },
  })

  // Update form when data is fetched
  useEffect(() => {
    if (sipConfig) {
      reset({
        authId: sipConfig.authId,
        authPassword: sipConfig.authPassword,
        gwPrefix: sipConfig.gwPrefix,
        proxy: sipConfig.proxy,
        registrar: sipConfig.registrar,
        registerExpired: sipConfig.registerExpired,
        phoneNumber: sipConfig.phoneNumber,
        displayName: sipConfig.displayName,
        outboundProxy: sipConfig.outboundProxy,
        homeDomain: sipConfig.homeDomain,
      })
    }
  }, [sipConfig, reset])

  const onSubmit = async (data: SipConfigFormData) => {
    updateSipConfig(
      {
        deviceId,
        lineNumber: portNumber,
        authId: data.authId,
        authPassword: data.authPassword,
        gwPrefix: data.gwPrefix,
        proxy: data.proxy,
        registrar: data.registrar,
        registerExpired: data.registerExpired,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        outboundProxy: data.outboundProxy,
        homeDomain: data.homeDomain,
      },
      {
        onSuccess: () => {
          toast.success(
            t(
              'gsmDevices.sipConfig.updateSuccess',
              'SIP configuration updated successfully',
            ),
          )
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(
            error?.message ||
              t(
                'gsmDevices.sipConfig.updateError',
                'Failed to update SIP configuration',
              ),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('gsmDevices.sipConfig.title', 'SIP Configuration')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'gsmDevices.sipConfig.description',
              'Configure SIP settings for Port {{port}}',
              { port: portNumber },
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              {/* Authentication ID */}
              <div className="grid gap-2">
                <Label htmlFor="authId">
                  {t('gsmDevices.sipConfig.authId', 'Authentication ID')}
                </Label>
                <Input
                  id="authId"
                  {...register('authId')}
                  placeholder="9001111"
                />
                {errors.authId && (
                  <p className="text-sm text-destructive">
                    {errors.authId.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="authPassword">
                  {t('gsmDevices.sipConfig.password', 'Password')}
                </Label>
                <div className="relative">
                  <Input
                    id="authPassword"
                    type={showPassword ? 'text' : 'password'}
                    {...register('authPassword')}
                    placeholder="••••••••••"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.authPassword && (
                  <p className="text-sm text-destructive">
                    {errors.authPassword.message}
                  </p>
                )}
              </div>

              {/* Routing Prefix */}
              <div className="grid gap-2">
                <Label htmlFor="gwPrefix">
                  {t('gsmDevices.sipConfig.routingPrefix', 'Routing Prefix')}
                </Label>
                <Input
                  id="gwPrefix"
                  {...register('gwPrefix')}
                  placeholder="9001"
                />
                {errors.gwPrefix && (
                  <p className="text-sm text-destructive">
                    {errors.gwPrefix.message}
                  </p>
                )}
              </div>

              {/* SIP Proxy */}
              <div className="grid gap-2">
                <Label htmlFor="proxy">
                  {t('gsmDevices.sipConfig.sipProxy', 'SIP Proxy')}
                </Label>
                <Input
                  id="proxy"
                  {...register('proxy')}
                  placeholder="callio-tech.com:15060"
                />
                {errors.proxy && (
                  <p className="text-sm text-destructive">
                    {errors.proxy.message}
                  </p>
                )}
              </div>

              {/* SIP Registrar Server */}
              <div className="grid gap-2">
                <Label htmlFor="registrar">
                  {t(
                    'gsmDevices.sipConfig.sipRegistrar',
                    'SIP Registrar Server',
                  )}
                </Label>
                <Input
                  id="registrar"
                  {...register('registrar')}
                  placeholder="callio-tech.com:15060"
                />
                {errors.registrar && (
                  <p className="text-sm text-destructive">
                    {errors.registrar.message}
                  </p>
                )}
              </div>

              {/* Re-register Period */}
              <div className="grid gap-2">
                <Label htmlFor="registerExpired">
                  {t(
                    'gsmDevices.sipConfig.reregisterPeriod',
                    'Re-register Period (s)',
                  )}
                </Label>
                <Input
                  id="registerExpired"
                  type="number"
                  {...register('registerExpired', { valueAsNumber: true })}
                  placeholder="60"
                />
                {errors.registerExpired && (
                  <p className="text-sm text-destructive">
                    {errors.registerExpired.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">
                  {t('gsmDevices.sipConfig.phoneNumber', 'Phone Number')}
                </Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder=""
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div className="grid gap-2">
                <Label htmlFor="displayName">
                  {t('gsmDevices.sipConfig.displayName', 'Display Name')}
                </Label>
                <Input
                  id="displayName"
                  {...register('displayName')}
                  placeholder="Line 1"
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Outbound Proxy */}
              <div className="grid gap-2">
                <Label htmlFor="outboundProxy">
                  {t('gsmDevices.sipConfig.outboundProxy', 'Outbound Proxy')}
                </Label>
                <Input
                  id="outboundProxy"
                  {...register('outboundProxy')}
                  placeholder=""
                />
                {errors.outboundProxy && (
                  <p className="text-sm text-destructive">
                    {errors.outboundProxy.message}
                  </p>
                )}
              </div>

              {/* Home Domain */}
              <div className="grid gap-2">
                <Label htmlFor="homeDomain">
                  {t('gsmDevices.sipConfig.homeDomain', 'Home Domain')}
                </Label>
                <Input
                  id="homeDomain"
                  {...register('homeDomain')}
                  placeholder=""
                />
                {errors.homeDomain && (
                  <p className="text-sm text-destructive">
                    {errors.homeDomain.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.submit', 'Submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
