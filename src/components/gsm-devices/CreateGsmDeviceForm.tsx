import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GsmDeviceStatus, GsmDevice } from '@/lib/api/types/gsm-devices.types';
import { useCreateGsmDevice, useUpdateGsmDevice } from '@/hooks/api/useGsmDevices';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

const createGsmDeviceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  remoteUrl: z.string().min(1, 'Remote URL is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  model: z.string().optional(),
  totalPorts: z.number().min(1, 'Total ports must be at least 1'),
  status: z.nativeEnum(GsmDeviceStatus, {
    message: 'Status is required',
  }),
  firmwareVersion: z.string().optional(),
});

type CreateGsmDeviceFormValues = z.infer<typeof createGsmDeviceSchema>;

interface CreateGsmDeviceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: GsmDevice;
}

export function CreateGsmDeviceForm({ open, onOpenChange, initialValues }: CreateGsmDeviceFormProps) {
  const { t } = useTranslation();
  const { mutate: createGsmDevice, isPending: isCreatePending } = useCreateGsmDevice();
  const { mutate: updateGsmDevice, isPending: isUpdatePending } = useUpdateGsmDevice();
  const [showPassword, setShowPassword] = useState(false);
  
  const isEditing = !!initialValues;
  const isPending = isCreatePending || isUpdatePending;

  const form = useForm<CreateGsmDeviceFormValues>({
    resolver: zodResolver(createGsmDeviceSchema),
    defaultValues: {
      name: '',
      remoteUrl: '',
      username: '',
      password: '',
      model: '',
      totalPorts: 1,
      status: GsmDeviceStatus.OFFLINE,
      firmwareVersion: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          name: initialValues.name,
          remoteUrl: initialValues.remoteUrl,
          username: initialValues.username,
          password: initialValues.password,
          model: initialValues.model || '',
          totalPorts: initialValues.totalPorts,
          status: initialValues.status,
          firmwareVersion: initialValues.firmwareVersion || '',
        });
      } else {
        form.reset({
          name: '',
          remoteUrl: '',
          username: '',
          password: '',
          model: '',
          totalPorts: 1,
          status: GsmDeviceStatus.OFFLINE,
          firmwareVersion: '',
        });
      }
    }
  }, [open, initialValues, form]);

  const onSubmit = (data: CreateGsmDeviceFormValues) => {
    if (isEditing && initialValues) {
      updateGsmDevice(
        { id: initialValues.id, data },
        {
          onSuccess: () => {
            toast.success(t('gsmDevices.updateSuccess', 'GSM Device updated successfully'));
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(
              error?.message || t('gsmDevices.updateError', 'Failed to update GSM device')
            );
          },
        }
      );
    } else {
      createGsmDevice(
        data,
        {
          onSuccess: () => {
            toast.success(t('gsmDevices.createSuccess', 'GSM Device created successfully'));
            form.reset();
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(
              error?.message || t('gsmDevices.createError', 'Failed to create GSM device')
            );
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? t('gsmDevices.edit', 'Edit GSM Device') 
              : t('gsmDevices.create', 'Add GSM Device')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('gsmDevices.editDescription', 'Update the details of the GSM device')
              : t('gsmDevices.createDescription', 'Add a new GSM device to the system')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.form.name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('gsmDevices.form.namePlaceholder', 'Device name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remoteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.form.remoteUrl', 'Remote URL')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('gsmDevices.form.remoteUrlPlaceholder', 'http://192.168.1.100:8080')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('gsmDevices.form.username', 'Username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('gsmDevices.form.usernamePlaceholder', 'admin')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('gsmDevices.form.password', 'Password')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('gsmDevices.form.passwordPlaceholder', '********')}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.form.model', 'Model')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('gsmDevices.form.modelPlaceholder', 'Device model')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalPorts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.form.totalPorts', 'Total Ports')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="8" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.form.status', 'Status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('gsmDevices.form.statusPlaceholder', 'Select status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={GsmDeviceStatus.ONLINE}>
                        {t('gsmDevices.status.online', 'Online')}
                      </SelectItem>
                      <SelectItem value={GsmDeviceStatus.OFFLINE}>
                        {t('gsmDevices.status.offline', 'Offline')}
                      </SelectItem>
                      <SelectItem value={GsmDeviceStatus.DEGRADED}>
                        {t('gsmDevices.status.degraded', 'Degraded')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firmwareVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.form.firmwareVersion', 'Firmware Version')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('gsmDevices.form.firmwareVersionPlaceholder', 'v1.0.0')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending 
                  ? (isEditing ? t('common.updating', 'Updating...') : t('common.creating', 'Creating...'))
                  : (isEditing ? t('common.update', 'Update') : t('common.create', 'Create'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
