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
import { GsmPortStatus, GsmDevicePort } from '@/lib/api/types/gsm-devices.types';
import { useCreateGsmDevicePort, useUpdateGsmDevicePort } from '@/hooks/api/useGsmDevices';
import { toast } from 'sonner';
import { useEffect } from 'react';

const createGsmDevicePortSchema = z.object({
  portNumber: z.number().min(1, 'Port number is required'),
  msisdn: z.string().min(1, 'Phone number is required'),
  status: z.nativeEnum(GsmPortStatus, {
    message: 'Status is required',
  }),
});

type CreateGsmDevicePortFormValues = z.infer<typeof createGsmDevicePortSchema>;

interface CreateGsmDevicePortFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gsmDeviceId: string;
  initialValues?: GsmDevicePort;
}

export function CreateGsmDevicePortForm({ open, onOpenChange, gsmDeviceId, initialValues }: CreateGsmDevicePortFormProps) {
  const { t } = useTranslation();
  const { mutate: createGsmDevicePort, isPending: isCreatePending } = useCreateGsmDevicePort();
  const { mutate: updateGsmDevicePort, isPending: isUpdatePending } = useUpdateGsmDevicePort();

  const isEditing = !!initialValues;
  const isPending = isEditing ? isUpdatePending : isCreatePending;

  const form = useForm<CreateGsmDevicePortFormValues>({
    resolver: zodResolver(createGsmDevicePortSchema),
    defaultValues: {
      portNumber: 1,
      msisdn: '',
      status: GsmPortStatus.AVAILABLE,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          portNumber: initialValues.portNumber,
          msisdn: initialValues.msisdn,
          status: initialValues.status,
        });
      } else {
        form.reset({
          portNumber: 1,
          msisdn: '',
          status: GsmPortStatus.AVAILABLE,
        });
      }
    }
  }, [open, initialValues, form]);

  const onSubmit = (data: CreateGsmDevicePortFormValues) => {
    if (isEditing && initialValues) {
      updateGsmDevicePort(
        { id: initialValues.id, data: { ...data, deviceId: gsmDeviceId } },
        {
          onSuccess: () => {
            toast.success(t('gsmDevices.ports.updateSuccess', 'Port updated successfully'));
            form.reset();
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(
              error?.message || t('gsmDevices.ports.updateError', 'Failed to update port')
            );
          },
        }
      );
    } else {
      createGsmDevicePort(
        { ...data, deviceId: gsmDeviceId },
        {
          onSuccess: () => {
            toast.success(t('gsmDevices.ports.createSuccess', 'Port added successfully'));
            form.reset();
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(
              error?.message || t('gsmDevices.ports.createError', 'Failed to add port')
            );
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? t('gsmDevices.ports.edit', 'Edit Port') 
              : t('gsmDevices.ports.add', 'Add Port')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('gsmDevices.ports.editDescription', 'Update the port details')
              : t('gsmDevices.ports.addDescription', 'Add a new port to this GSM device')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="portNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.ports.form.portNumber', 'Port Number')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="1" 
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
              name="msisdn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gsmDevices.ports.form.phoneNumber', 'Phone Number')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+62812345678" {...field} />
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
                  <FormLabel>{t('gsmDevices.ports.form.status', 'Status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('gsmDevices.ports.form.statusPlaceholder', 'Select status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={GsmPortStatus.AVAILABLE}>
                        {t('gsmDevices.ports.status.available', 'Available')}
                      </SelectItem>
                      <SelectItem value={GsmPortStatus.IN_USE}>
                        {t('gsmDevices.ports.status.inUse', 'In Use')}
                      </SelectItem>
                      <SelectItem value={GsmPortStatus.DISABLED}>
                        {t('gsmDevices.ports.status.disabled', 'Disabled')}
                      </SelectItem>
                      <SelectItem value={GsmPortStatus.ERROR}>
                        {t('gsmDevices.ports.status.error', 'Error')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                  ? (isEditing ? t('common.updating', 'Updating...') : t('common.adding', 'Adding...'))
                  : (isEditing ? t('common.update', 'Update') : t('common.add', 'Add'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
