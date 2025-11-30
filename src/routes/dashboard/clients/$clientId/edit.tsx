import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useClient, useUpdateClient } from '@/hooks/api/useClients';
import { ClientStatus } from '@/lib/api/types/clients.types';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/clients/$clientId/edit')({
  component: EditClientPage,
});

const editClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(ClientStatus),
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

function EditClientPage() {
  const { clientId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: client, isLoading: isLoadingClient } = useClient(clientId);
  const updateClient = useUpdateClient();

  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: ClientStatus.ACTIVE,
    },
  });

  // Reset form when client data is loaded
  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        status: client.status,
      });
    }
  }, [client, form]);

  const onSubmit = (data: EditClientFormValues) => {
    updateClient.mutate(
      { id: clientId, data },
      {
        onSuccess: () => {
          toast.success(t('clients.updateSuccess', 'Client updated successfully'));
          navigate({ to: '/dashboard/clients', search: { page: 1, limit: 10 } });
        },
        onError: (error) => {
          toast.error(error.message || t('clients.updateError', 'Failed to update client'));
        },
      }
    );
  };

  if (isLoadingClient) {
    return <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>;
  }

  if (!client) {
    return <div className="p-8 text-center">{t('clients.notFound', 'Client not found')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/dashboard/clients', search: { page: 1, limit: 10 } })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{t('clients.editTitle', 'Edit Client')}</h1>
        </div>
      </div>

      <div className="rounded-md border p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.form.name', 'Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('clients.form.placeholders.name', 'Acme Corp')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.form.email', 'Email')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('clients.form.placeholders.email', 'contact@acme.com')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.form.phone', 'Phone')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('clients.form.placeholders.phone', '+1 234 567 890')} {...field} />
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
                    <FormLabel>{t('clients.form.status', 'Status')}</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        {Object.values(ClientStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('clients.form.address', 'Address')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('clients.form.placeholders.address', '123 Main St, City, Country')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/dashboard/clients', search: { page: 1, limit: 10 } })}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={updateClient.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateClient.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
