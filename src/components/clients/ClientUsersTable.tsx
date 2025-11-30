import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, MoreHorizontal, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from '@/lib/api/types/users.types';
import { UserRole, UserStatus } from '@/lib/api/types';
import { useCreateUser } from '@/hooks/api/useUsers';
import { useUsers } from '@/hooks/api/useUsers';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ClientUsersTableProps {
  users: User[];
  isLoading?: boolean;
  clientId?: string;
}

const createUserSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: 'Role is required',
  }),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  passwordHash: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  supervisorId: z.string().nullable().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function ClientUsersTable({ users, isLoading = false, clientId }: ClientUsersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  const { data: supervisors } = useUsers({
    role: UserRole.SUPERVISOR,
    clientId: clientId || undefined,
    limit: 100,
  });
  const { mutate: createUser, isPending: isCreating } = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      passwordHash: '',
      phone: '',
      supervisorId: null,
    },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    const payload = {
      ...data,
      clientId: clientId!,
      status: UserStatus.PENDING,
      supervisorId: data.supervisorId || undefined, // Convert null to undefined
    };

    createUser(payload, {
      onSuccess: () => {
        toast.success(t('clients.users.userCreated', 'User created successfully'));
        form.reset();
      },
      onError: () => {
        toast.error(t('clients.users.userCreationFailed', 'Failed to create user'));
      },
    });
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role !== UserRole.AGENT) {
      form.setValue('supervisorId', null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.email.toLowerCase().includes(searchValue.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    const roleClasses = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      agent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      superadmin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          roleClasses[role] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {role}
      </span>
    );
  };

  const getStatusBadge = (status: UserStatus) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      pending_verification: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      disabled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          statusClasses[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('clients.users.title', 'Users')}</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                {t('clients.users.addUser', 'Add User')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('clients.users.addUser', 'Add New User')}</DialogTitle>
                <DialogDescription>
                  {t('clients.users.addUserDescription', 'Create a new user for the selected client.')}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('clients.users.role', 'Role')}</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              handleRoleChange(e.target.value as UserRole);
                            }}
                            defaultValue={field.value}
                          >
                            <option value="">{t('clients.users.selectRole', 'Select role')}</option>
                            <option value="admin">{t('users.role.admin', 'Admin')}</option>
                            <option value="supervisor">{t('users.role.supervisor', 'Supervisor')}</option>
                            <option value="agent">{t('users.role.agent', 'Agent')}</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('clients.users.name', 'Name')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('clients.users.name', 'Enter full name')} {...field} />
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
                          <FormLabel>{t('clients.users.email', 'Email')}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t('clients.users.email', 'Enter email address')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="passwordHash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('clients.users.password', 'Password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('clients.users.password', 'Enter password')} {...field} />
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
                        <FormLabel>{t('clients.users.phone', 'Phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('clients.users.phone', 'Enter phone number (optional)')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedRole === 'agent' && supervisors && (
                    <FormField
                      control={form.control}
                      name="supervisorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('clients.users.supervisor', 'Supervisor')}</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              onBlur={field.onBlur}
                            >
                              <option value="">{t('clients.users.selectSupervisor', 'Select supervisor')}</option>
                              {supervisors.data.map((supervisor) => (
                                <option key={supervisor.id} value={supervisor.id}>
                                  {supervisor.name} ({supervisor.email})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? t('common.creating', 'Creating...') : t('clients.users.addUser', 'Add User')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
            <Input
              placeholder={t('clients.users.searchPlaceholder', 'Search users...')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          >
            <option value="all">{t('common.all', 'All Roles')}</option>
            <option value="admin">{t('users.role.admin', 'Admin')}</option>
            <option value="supervisor">{t('users.role.supervisor', 'Supervisor')}</option>
            <option value="agent">{t('users.role.agent', 'Agent')}</option>
          </select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-primary">
                  {t('clients.users.name', 'Name')}
                </TableHead>
                <TableHead className="font-semibold text-primary">
                  {t('clients.users.email', 'Email')}
                </TableHead>
                <TableHead className="font-semibold text-primary">
                  {t('clients.users.role', 'Role')}
                </TableHead>
                <TableHead className="font-semibold text-primary">
                  {t('common.status', 'Status')}
                </TableHead>
                <TableHead className="font-semibold text-primary">
                  {t('clients.users.supervisor', 'Supervisor')}
                </TableHead>
                <TableHead className="font-semibold text-primary text-right">
                  {t('common.actions', 'Actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('common.loading', 'Loading...')}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('clients.users.noUsers', 'No users found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.supervisorId ? user.supervisorId : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {t('common.actions', 'Actions')}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => navigate({ to: `/dashboard/users/${user.id}` })}
                          >
                            {t('common.view', 'View')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate({ to: `/dashboard/users/${user.id}/edit` })}
                          >
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
