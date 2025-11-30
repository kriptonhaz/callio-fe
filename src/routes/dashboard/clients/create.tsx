import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useCreateClient } from '@/hooks/api/useClients';
import { ClientStatus } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/clients/create')({
  component: CreateClientPage,
});

const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.ACTIVE),
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

function CreateClientPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createClient = useCreateClient();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: ClientStatus.ACTIVE,
    },
  });

  const onSubmit = (data: CreateClientFormValues) => {
    createClient.mutate(data, {
      onSuccess: () => {
        toast.success(t('clients.createSuccess', 'Client created successfully'));
        navigate({ to: '/dashboard/clients', search: { page: 1, limit: 10 } });
      },
      onError: (error) => {
        toast.error(error.message || t('clients.createError', 'Failed to create client'));
      },
    });
  };

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('clients.createTitle', 'Create Client')}</CardTitle>
          <CardDescription>
            {t('clients.createSubtitle', 'Add a new client to the system')}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  control={form.control as any}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.form.status', 'Status')}</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.form.address', 'Address')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('clients.form.placeholders.address', '123 Main St, City, Country')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end space-x-4 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/dashboard/clients', search: { page: 1, limit: 10 } })}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
