import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/api/useUsers'
import { UserRole, UserStatus } from '@/lib/api/types'
import { User } from '@/lib/api/types/users.types'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Trash2, Save } from 'lucide-react'

// Schema
const internalUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  passwordHash: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole, {
    message: 'Role is required',
  }),
})

type InternalUserFormValues = z.infer<typeof internalUserSchema>

interface InternalUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: User | null
  onSuccess?: () => void
}

export function InternalUserSheet({
  open,
  onOpenChange,
  initialValues,
  onSuccess,
}: InternalUserSheetProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { mutate: createUser, isPending: isCreatePending } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdatePending } = useUpdateUser()
  const { mutate: deleteUser, isPending: isDeletePending } = useDeleteUser()

  const isEditing = !!initialValues
  const isPending = isCreatePending || isUpdatePending || isDeletePending

  const form = useForm<InternalUserFormValues>({
    resolver: zodResolver(internalUserSchema),
    defaultValues: {
      name: '',
      email: '',
      passwordHash: '',
      phone: '',
      role: UserRole.SALES,
    },
  })

  // Reset form when opening or changing user
  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          name: initialValues.name,
          email: initialValues.email,
          passwordHash: '',
          phone: initialValues.phone || '',
          role: initialValues.role,
        })
      } else {
        form.reset({
          name: '',
          email: '',
          passwordHash: '',
          phone: '',
          role: UserRole.SALES,
        })
      }
    }
  }, [open, initialValues, form])

  const onSubmit = (data: InternalUserFormValues) => {
    if (isEditing && initialValues) {
      // Update
      const payload = {
        ...data,
        clientId: undefined,
        supervisorId: undefined,
        status: initialValues.status,
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
      }

      // If password is empty string, remove it from payload so it doesn't overwrite
      if (!data.passwordHash) {
        delete (payload as any).passwordHash
      }

      updateUser(
        { id: initialValues.id, data: payload },
        {
          onSuccess: () => {
            toast.success(
              t('internalUser.updateSuccess', 'User updated successfully'),
            )
            onSuccess?.()
            onOpenChange(false)
          },
          onError: (error: any) => {
            toast.error(
              error?.message ||
                t('internalUser.updateError', 'Failed to update user'),
            )
          },
        },
      )
    } else {
      // Create
      if (!data.passwordHash) {
        form.setError('passwordHash', {
          message: t('validation.required', 'Password is required'),
        })
        return
      }

      const payload = {
        ...data,
        passwordHash: data.passwordHash!,
        clientId: undefined,
        supervisorId: undefined,
        status: UserStatus.PENDING,
        verificationUrl: `${window.location.origin}/verify?token=${Math.random().toString(36).substring(7)}`,
      }

      createUser(payload, {
        onSuccess: () => {
          toast.success(
            t('internalUser.createSuccess', 'User created successfully'),
          )
          onSuccess?.()
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(
            error?.message ||
              t('internalUser.createError', 'Failed to create user'),
          )
        },
      })
    }
  }

  const handleDelete = () => {
    if (!initialValues) return

    deleteUser(initialValues.id, {
      onSuccess: () => {
        toast.success(
          t('internalUser.deleteSuccess', 'User deleted successfully'),
        )
        setDeleteDialogOpen(false)
        onOpenChange(false)
        onSuccess?.()
      },
      onError: (error: any) => {
        toast.error(
          error?.message ||
            t('internalUser.deleteError', 'Failed to delete user'),
        )
      },
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>
              {isEditing
                ? t('internalUser.edit', 'Edit Internal User')
                : t('internalUser.create', 'Add Internal User')}
            </SheetTitle>
            <SheetDescription>
              {isEditing
                ? t(
                    'internalUser.editDescription',
                    'Update details for this internal user.',
                  )
                : t(
                    'internalUser.createDescription',
                    'Add a new internal user to the system.',
                  )}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('internalUser.form.name', 'Name')}{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                      <FormLabel>
                        {t('internalUser.form.email', 'Email')}{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordHash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isEditing
                          ? t(
                              'internalUser.form.passwordEdit',
                              'Password (leave blank to keep current)',
                            )
                          : t('internalUser.form.password', 'Password')}{' '}
                        {!isEditing && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="********"
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

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('internalUser.form.phone', 'Phone')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+62..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('internalUser.form.role', 'Role')}{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UserRole.SALES}>
                            {t('internalUser.role.sales', 'Sales')}
                          </SelectItem>
                          <SelectItem value={UserRole.ADMIN}>
                            {t('internalUser.role.admin', 'Admin')}
                          </SelectItem>
                          <SelectItem value={UserRole.SUPERADMIN}>
                            {t('internalUser.role.superadmin', 'Superadmin')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t bg-muted/20 px-6 py-4 flex items-center justify-between">
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('common.delete', 'Delete')}
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditing
                      ? t('common.saveChanges', 'Save Changes')
                      : t('common.create', 'Create User')}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('internalUser.deleteTitle', 'Delete User')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'internalUser.deleteDescription',
                'Are you sure you want to delete {{name}}? This action cannot be undone.',
                { name: initialValues?.name },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.delete', 'Delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
