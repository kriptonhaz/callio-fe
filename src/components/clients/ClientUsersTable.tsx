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
import { Search, MoreHorizontal } from 'lucide-react';
import type { User } from '@/lib/api/types/users.types';
import type { UserRole, UserStatus } from '@/lib/api/types';

interface ClientUsersTableProps {
  users: User[];
  isLoading?: boolean;
}

export function ClientUsersTable({ users, isLoading = false }: ClientUsersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

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
        <CardTitle>{t('clients.users.title', 'Users')}</CardTitle>
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
