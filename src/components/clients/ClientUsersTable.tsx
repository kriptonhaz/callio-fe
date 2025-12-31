import { useState } from 'react'
import { StandardPagination } from '@/components/common/StandardPagination'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Eye,
  EyeOff,
  Edit,
  Trash,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { User, CreateUserRequest } from '@/lib/api/types/users.types'
import { UserRole, UserStatus } from '@/lib/api/types'
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/api/useUsers'
import { useUsers } from '@/hooks/api/useUsers'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ClientUsersTableProps {
  users: User[]
  isLoading?: boolean
  clientId?: string
}

const createUserSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: 'Role is required',
  }),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  passwordHash: z.string().optional(), // Made optional for edit
  phone: z.string().optional(),
  supervisorId: z.string().nullable().optional(),
  status: z.nativeEnum(UserStatus).optional(),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

export function ClientUsersTable({
  users,
  isLoading = false,
  clientId,
}: ClientUsersTableProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  // Action state
  const [currentAction, setCurrentAction] = useState<
    'create' | 'edit' | 'view' | 'delete' | null
  >(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const { data: supervisors } = useUsers({
    role: UserRole.SUPERVISOR,
    clientId: clientId || undefined,
    limit: 100,
  })

  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()

  // Form for Create/Edit
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      passwordHash: '',
      phone: '',
      supervisorId: null,
      role: undefined,
    },
  })

  // Reset form when modal closes or action changes
  const closeDialog = () => {
    setCurrentAction(null)
    setSelectedUser(null)
    form.reset({
      name: '',
      email: '',
      passwordHash: '',
      phone: '',
      supervisorId: null,
      role: undefined,
    })
  }

  const openCreateDialog = () => {
    setCurrentAction('create')
    form.reset({
      name: '',
      email: '',
      passwordHash: '',
      phone: '',
      supervisorId: null,
      role: undefined,
    })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setCurrentAction('edit')
    form.reset({
      name: user.name,
      email: user.email,
      passwordHash: 'placeholder', // Password not required for edit, but schema might need it. We'll handle schema separately or use a different one.
      phone: user.phone || '',
      supervisorId: user.supervisorId || null,
      role: user.role,
    })
  }

  const openViewDialog = (user: User) => {
    setSelectedUser(user)
    setCurrentAction('view')
    form.reset({
      name: user.name,
      email: user.email,
      passwordHash: '',
      phone: user.phone || '',
      supervisorId: user.supervisorId || null,
      role: user.role,
      status: user.status,
    })
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setCurrentAction('delete')
  }

  const onSubmit = (data: CreateUserFormValues) => {
    if (currentAction === 'create') {
      if (!data.passwordHash) {
        form.setError('passwordHash', {
          message: t('validation.passwordRequired', 'Password is required'),
        })
        return
      }

      const payload: CreateUserRequest = {
        ...data,
        passwordHash: data.passwordHash,
        clientId: clientId!,
        status: UserStatus.PENDING,
        supervisorId: data.supervisorId || undefined,
      }

      createUser(payload, {
        onSuccess: () => {
          toast.success(
            t('clients.users.userCreated', 'User created successfully'),
          )
          closeDialog()
        },
        onError: () => {
          toast.error(
            t('clients.users.userCreationFailed', 'Failed to create user'),
          )
        },
      })
    } else if (currentAction === 'edit' && selectedUser) {
      // For edit, we don't send password if it's not changed (or in this case, we don't edit it at all)
      // We need to construct the payload specifically for edit
      const payload: any = {
        clientId: clientId!,
        role: data.role,
        name: data.name,
        phone: data.phone,
        supervisorId: data.supervisorId || undefined,
        // Status is missing in the form schema currently, need to add it
      }

      // We'll handle status separately in the form render for now or update schema
      if (data.status) {
        payload.status = data.status
      }

      updateUser(
        { id: selectedUser.id, data: payload },
        {
          onSuccess: () => {
            toast.success(
              t('clients.users.userUpdated', 'User updated successfully'),
            )
            closeDialog()
          },
          onError: () => {
            toast.error(
              t('clients.users.userUpdateFailed', 'Failed to update user'),
            )
          },
        },
      )
    }
  }

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id, {
        onSuccess: () => {
          toast.success(
            t('clients.users.userDeleted', 'User deleted successfully'),
          )
          closeDialog()
        },
        onError: () => {
          toast.error(
            t('clients.users.userDeleteFailed', 'Failed to delete user'),
          )
        },
      })
    }
  }

  const handleRoleChange = (role: UserRole) => {
    if (role !== UserRole.AGENT) {
      form.setValue('supervisorId', null)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.email.toLowerCase().includes(searchValue.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalItems = filteredUsers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  )

  const getRoleBadge = (role: UserRole) => {
    const roleClasses = {
      admin:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      supervisor:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      agent:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      superadmin:
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      sales:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    }

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          roleClasses[role] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {role}
      </span>
    )
  }

  const getStatusBadge = (status: UserStatus) => {
    const statusClasses = {
      active:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive:
        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      pending_verification:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      disabled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          statusClasses[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    )
  }

  // Helper to render form fields based on action
  const renderFormFields = () => {
    const isView = currentAction === 'view'
    const isEdit = currentAction === 'edit'
    const isCreate = currentAction === 'create'

    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('clients.users.role', 'Role')}</FormLabel>
              <FormControl>
                {isView ? (
                  <div className="p-2 border rounded-md bg-muted">
                    {getRoleBadge(field.value)}
                  </div>
                ) : (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleRoleChange(value as UserRole)
                    }}
                    value={field.value}
                    disabled={isView}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          'clients.users.selectRole',
                          'Select role',
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        {t('users.role.admin', 'Admin')}
                      </SelectItem>
                      <SelectItem value="supervisor">
                        {t('users.role.supervisor', 'Supervisor')}
                      </SelectItem>
                      <SelectItem value="agent">
                        {t('users.role.agent', 'Agent')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                  {isView ? (
                    <div className="p-2 border rounded-md bg-muted">
                      {field.value}
                    </div>
                  ) : (
                    <Input
                      placeholder={t('clients.users.name', 'Enter full name')}
                      {...field}
                    />
                  )}
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
                  {isView || isEdit ? (
                    <div className="p-2 border rounded-md bg-muted">
                      {field.value}
                    </div>
                  ) : (
                    <Input
                      type="email"
                      placeholder={t(
                        'clients.users.email',
                        'Enter email address',
                      )}
                      {...field}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isCreate && (
          <FormField
            control={form.control}
            name="passwordHash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.users.password', 'Password')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t(
                        'clients.users.password',
                        'Enter password',
                      )}
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
                      <span className="sr-only">
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('clients.users.phone', 'Phone')}</FormLabel>
              <FormControl>
                {isView ? (
                  <div className="p-2 border rounded-md bg-muted">
                    {field.value || '-'}
                  </div>
                ) : (
                  <Input
                    placeholder={t(
                      'clients.users.phone',
                      'Enter phone number (optional)',
                    )}
                    {...field}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Supervisor field - only if role is agent */}
        {(form.watch('role') === 'agent' ||
          (isView && selectedUser?.role === 'agent')) &&
          supervisors && (
            <FormField
              control={form.control}
              name="supervisorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('clients.users.supervisor', 'Supervisor')}
                  </FormLabel>
                  <FormControl>
                    {isView ? (
                      <div className="p-2 border rounded-md bg-muted">
                        {supervisors.data.find((s) => s.id === field.value)
                          ?.name || '-'}
                      </div>
                    ) : (
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        onBlur={field.onBlur}
                      >
                        <option value="">
                          {t(
                            'clients.users.selectSupervisor',
                            'Select supervisor',
                          )}
                        </option>
                        {supervisors.data.map((supervisor) => (
                          <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.name} ({supervisor.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        {/* Status field - only for Edit/View */}
        {(isEdit || isView) && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.status', 'Status')}</FormLabel>
                <FormControl>
                  {isView ? (
                    <div className="p-2 border rounded-md bg-muted">
                      {getStatusBadge(field.value as UserStatus)}
                    </div>
                  ) : (
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {Object.values(UserStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('clients.users.title', 'Users')}</CardTitle>
          <Button size="sm" className="gap-2" onClick={openCreateDialog}>
            <UserPlus className="h-4 w-4" />
            {t('clients.users.addUser', 'Add User')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
            <Input
              placeholder={t(
                'clients.users.searchPlaceholder',
                'Search users...',
              )}
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
            <option value="supervisor">
              {t('users.role.supervisor', 'Supervisor')}
            </option>
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
                paginatedUsers.map((user) => (
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
                            onClick={() => openViewDialog(user)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('common.view', 'View')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(user)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t('common.delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <StandardPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setPage}
            />
          )}
        </div>
      </CardContent>

      {/* Main Dialog for Create/Edit/View */}
      <Dialog
        open={!!currentAction && currentAction !== 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'create' &&
                t('clients.users.addUser', 'Add New User')}
              {currentAction === 'edit' &&
                t('clients.users.editUser', 'Edit User')}
              {currentAction === 'view' &&
                t('clients.users.viewUser', 'View User')}
            </DialogTitle>
            <DialogDescription>
              {currentAction === 'create' &&
                t(
                  'clients.users.addUserDescription',
                  'Create a new user for the selected client.',
                )}
              {currentAction === 'edit' &&
                t('clients.users.editUserDescription', 'Edit user details.')}
              {currentAction === 'view' &&
                t('clients.users.viewUserDescription', 'View user details.')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {renderFormFields()}
              <DialogFooter>
                {currentAction !== 'view' && (
                  <Button type="submit" disabled={isCreating || isUpdating}>
                    {currentAction === 'create'
                      ? isCreating
                        ? t('common.creating', 'Creating...')
                        : t('clients.users.addUser', 'Add User')
                      : isUpdating
                        ? t('common.updating', 'Updating...')
                        : t('common.saveChanges', 'Save Changes')}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t('common.close', 'Close')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={currentAction === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('common.confirmDelete', 'Confirm Delete')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'clients.users.deleteConfirmation',
                'Are you sure you want to delete this user? This action cannot be undone.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isDeleting}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? t('common.deleting', 'Deleting...')
                : t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
