import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RoleGuard } from '@/lib/auth-guard'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/api/useUsers'
import { useMe } from '@/hooks/api/useAuth'
import { useEnabledServices } from '@/hooks/api/useServices'
import { useClientExtensionRange } from '@/hooks/api/useSipRange'
import { useAssignSipExtension } from '@/hooks/api/useSipExtensions'
import { UserRole, UserStatus } from '@/lib/api/types'
import { ServiceType } from '@/lib/api/types/services.types'
import type { User, CreateUserRequest } from '@/lib/api/types/users.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Eye,
  EyeOff,
  Edit,
  Trash,
  Loader2,
  Phone,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'
import { StandardPagination } from '@/components/common/StandardPagination'

const createUserSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: 'Role is required',
  }),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  passwordHash: z.string().optional(),
  phone: z.string().optional(),
  supervisorId: z.string().nullable().optional(),
  status: z.nativeEnum(UserStatus).optional(),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

interface UsersSearch {
  page: number
  limit: number
  search?: string
}

export const Route = createFileRoute('/dashboard/users')({
  component: UsersPage,
  validateSearch: (search: Record<string, unknown>): UsersSearch => {
    return {
      page: Number(search.page || 1),
      limit: Number(search.limit || 10),
      search: (search.search as string) || undefined,
    }
  },
})

function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  const [searchValue, setSearchValue] = useState(searchParams.search || '')
  const debouncedSearch = useDebounce(searchValue, 500)

  // Auth context to get clientId
  const { data: me } = useMe()
  const clientId = me?.clientId

  // Dialog states
  const [currentAction, setCurrentAction] = useState<
    'create' | 'edit' | 'view' | 'delete' | null
  >(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [assignExtensionDialogOpen, setAssignExtensionDialogOpen] =
    useState(false)
  const [selectedUserForExtension, setSelectedUserForExtension] =
    useState<User | null>(null)
  const [selectedExtension, setSelectedExtension] = useState<string>('')

  // API hooks
  const { data: usersData, isLoading: usersLoading } = useUsers(
    {
      clientId,
      page: searchParams.page,
      limit: searchParams.limit,
      search: debouncedSearch,
    },
    !!clientId,
  )

  const { data: supervisors } = useUsers(
    {
      role: UserRole.SUPERVISOR,
      clientId,
      limit: 100,
    },
    !!clientId,
  )

  const { data: enabledServices } = useEnabledServices(clientId)
  const { data: extensionRange } = useClientExtensionRange(
    clientId || '',
    !!clientId,
  )

  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()
  const { mutate: assignExtension, isPending: isAssigningExtension } =
    useAssignSipExtension()

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

  const updateParams = (updates: Partial<UsersSearch>) => {
    navigate({
      search: ((prev: any) => ({ ...prev, ...updates })) as any,
    })
  }

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage })
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    updateParams({ search: value || undefined, page: 1 })
  }

  const closeDialog = () => {
    setCurrentAction(null)
    setSelectedUser(null)
    setShowPassword(false)
    form.reset()
  }

  const openCreateDialog = () => {
    setCurrentAction('create')
    form.reset({
      name: '',
      email: '',
      passwordHash: '',
      phone: '',
      supervisorId: null,
      role: UserRole.AGENT,
    })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setCurrentAction('edit')
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
      const payload: any = {
        role: data.role,
        name: data.name,
        phone: data.phone,
        supervisorId: data.supervisorId || undefined,
        status: data.status,
      }

      if (data.passwordHash) {
        payload.password = data.passwordHash
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

  // Check if VoIP service is enabled for the client
  const hasVoipService =
    enabledServices?.some((s) => s.serviceType === ServiceType.VOICE) ?? false

  const closeAssignExtensionDialog = () => {
    setAssignExtensionDialogOpen(false)
    setSelectedUserForExtension(null)
    setSelectedExtension('')
  }

  const openAssignExtensionDialog = (user: User) => {
    setSelectedUserForExtension(user)
    setSelectedExtension(user.sipExtension || '')
    setAssignExtensionDialogOpen(true)
  }

  const handleAssignExtension = () => {
    if (!selectedUserForExtension || !selectedExtension) return

    assignExtension(
      {
        extensionId: selectedExtension,
        userId: selectedUserForExtension.id,
      },
      {
        onSuccess: () => {
          toast.success(
            t('users.extensionAssigned', 'Extension assigned successfully'),
          )
          closeAssignExtensionDialog()
        },
        onError: () => {
          toast.error(
            t('users.extensionAssignFailed', 'Failed to assign extension'),
          )
        },
      },
    )
  }

  // Generate extension list from range
  const availableExtensions =
    extensionRange?.hasExtensions &&
    extensionRange.rangeStart &&
    extensionRange.rangeEnd
      ? Array.from(
          { length: extensionRange.rangeEnd - extensionRange.rangeStart + 1 },
          (_, i) => (extensionRange.rangeStart! + i).toString(),
        )
      : []

  // UI Helpers
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
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}
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
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('users.title', 'User Management')}
          </h1>
          <Button className="gap-2" onClick={openCreateDialog}>
            <UserPlus className="h-4 w-4" />
            {t('users.addUser', 'Add User')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('users.userList', 'Users')}</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('users.searchPlaceholder', 'Search users...')}
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <TableRow>
                    <TableHead className="font-semibold text-primary">
                      {t('users.name', 'Name')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('users.email', 'Email')}
                    </TableHead>
                    <TableHead className="font-semibold text-primary">
                      {t('users.role', 'Role')}
                    </TableHead>
                    {hasVoipService && (
                      <TableHead className="font-semibold text-primary">
                        {t('users.sipExtension', 'SIP Extension')}
                      </TableHead>
                    )}
                    <TableHead className="font-semibold text-primary">
                      {t('common.status', 'Status')}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-primary">
                      {t('common.actions', 'Actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={hasVoipService ? 6 : 5}
                        className="h-24 text-center"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('common.loading', 'Loading...')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : usersData?.data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={hasVoipService ? 6 : 5}
                        className="h-24 text-center"
                      >
                        {t('users.noUsersFound', 'No users found')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    usersData?.data.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        {hasVoipService && (
                          <TableCell>
                            {user.sipExtension ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {user.sipExtension}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
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
                              {hasVoipService && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    openAssignExtensionDialog(user)
                                  }
                                >
                                  <Phone className="mr-2 h-4 w-4" />
                                  {t(
                                    'users.assignExtension',
                                    'Assign Extension',
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(user)}
                                className="text-red-600"
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
              {usersData && (
                <StandardPagination
                  currentPage={searchParams.page}
                  totalPages={usersData.meta.totalPages}
                  totalItems={usersData.meta.total}
                  itemsPerPage={searchParams.limit}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit/View Dialog */}
        <Dialog
          open={!!currentAction && currentAction !== 'delete'}
          onOpenChange={(open) => !open && closeDialog()}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {currentAction === 'create' &&
                  t('users.addNewUser', 'Add New User')}
                {currentAction === 'edit' && t('users.editUser', 'Edit User')}
                {currentAction === 'view' && t('users.viewUser', 'View User')}
              </DialogTitle>
              <DialogDescription>
                {currentAction === 'create' &&
                  t(
                    'users.addUserDescription',
                    'Create a new user for your client account.',
                  )}
                {currentAction === 'edit' &&
                  t(
                    'users.editUserDescription',
                    'Update user account information.',
                  )}
                {currentAction === 'view' &&
                  t(
                    'users.viewUserDescription',
                    'View account details for this user.',
                  )}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('users.role', 'Role')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={currentAction === 'view'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  'users.selectRole',
                                  'Select role',
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
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
                          <FormLabel>{t('users.name', 'Name')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'users.namePlaceholder',
                                'Full name',
                              )}
                              {...field}
                              disabled={currentAction === 'view'}
                            />
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
                          <FormLabel>{t('users.email', 'Email')}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t(
                                'users.emailPlaceholder',
                                'Email address',
                              )}
                              {...field}
                              disabled={
                                currentAction === 'view' ||
                                currentAction === 'edit'
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {currentAction !== 'view' && (
                    <FormField
                      control={form.control}
                      name="passwordHash"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {currentAction === 'edit'
                              ? t(
                                  'users.newPassword',
                                  'New Password (optional)',
                                )
                              : t('users.password', 'Password')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t(
                                  'users.passwordPlaceholder',
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
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
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
                        <FormLabel>{t('users.phone', 'Phone')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'users.phonePlaceholder',
                              'Phone number',
                            )}
                            {...field}
                            disabled={currentAction === 'view'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(form.watch('role') === 'agent' ||
                    (currentAction === 'view' &&
                      selectedUser?.role === 'agent')) && (
                    <FormField
                      control={form.control}
                      name="supervisorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('users.supervisor', 'Supervisor')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            disabled={currentAction === 'view'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    'users.selectSupervisor',
                                    'Select supervisor',
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {supervisors?.data.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(currentAction === 'edit' || currentAction === 'view') && (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.status', 'Status')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={currentAction === 'view'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(UserStatus).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.replace(/_/g, ' ').toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <DialogFooter>
                  {currentAction !== 'view' && (
                    <Button type="submit" disabled={isCreating || isUpdating}>
                      {isCreating || isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {currentAction === 'create'
                        ? t('common.create', 'Create')
                        : t('common.save', 'Save')}
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    {t('common.cancel', 'Cancel')}
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
                  'users.deleteConfirmation',
                  'Are you sure you want to delete this user? This action cannot be undone.',
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('common.delete', 'Delete')}
              </Button>
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isDeleting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Extension Dialog */}
        <Dialog
          open={assignExtensionDialogOpen}
          onOpenChange={(open) => !open && closeAssignExtensionDialog()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('users.assignExtension', 'Assign Extension')}
              </DialogTitle>
              <DialogDescription>
                {t(
                  'users.assignExtensionDescription',
                  'Select an extension number to assign to this user.',
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('users.selectExtension', 'Select extension number')}
                </label>
                <Select
                  value={selectedExtension}
                  onValueChange={setSelectedExtension}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        'users.selectExtensionPlaceholder',
                        'Choose an extension',
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableExtensions.length > 0 ? (
                      availableExtensions.map((ext) => (
                        <SelectItem key={ext} value={ext}>
                          {ext}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t(
                          'users.noExtensionsAvailable',
                          'No extensions available',
                        )}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleAssignExtension}
                disabled={!selectedExtension || isAssigningExtension}
              >
                {isAssigningExtension && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('users.assign', 'Assign')}
              </Button>
              <Button
                variant="outline"
                onClick={closeAssignExtensionDialog}
                disabled={isAssigningExtension}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
