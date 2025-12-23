import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole, UserStatus } from '@/lib/api/types'
import { useCreateUser, useUpdateUser } from '@/hooks/api/useUsers'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { User } from '@/lib/api/types/users.types'

const createInternalUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  passwordHash: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole, {
    message: 'Role is required',
  }),
})

type CreateInternalUserFormValues = z.infer<typeof createInternalUserSchema>

interface InternalUserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: User
}

export function InternalUserForm({
  open,
  onOpenChange,
  initialValues,
}: InternalUserFormProps) {
  const { t } = useTranslation()
  const { mutate: createUser, isPending: isCreatePending } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdatePending } = useUpdateUser()
  const [showPassword, setShowPassword] = useState(false)

  const isEditing = !!initialValues
  const isPending = isCreatePending || isUpdatePending

  const form = useForm<CreateInternalUserFormValues>({
    resolver: zodResolver(createInternalUserSchema),
    defaultValues: {
      name: '',
      email: '',
      passwordHash: '',
      phone: '',
      role: UserRole.SALES,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          name: initialValues.name,
          email: initialValues.email,
          passwordHash: '', // Don't populate password for edit
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

  const onSubmit = (data: CreateInternalUserFormValues) => {
    if (isEditing && initialValues) {
      // Update existing user
      const payload = {
        ...data,
        // Only include password if it's been changed
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
        clientId: undefined,
        supervisorId: undefined,
        status: initialValues.status, // Keep existing status
      }

      updateUser(
        { id: initialValues.id, data: payload },
        {
          onSuccess: () => {
            toast.success(
              t(
                'internalUser.updateSuccess',
                'Internal user updated successfully',
              ),
            )
            form.reset()
            onOpenChange(false)
          },
          onError: (error: any) => {
            toast.error(
              error?.message ||
                t('internalUser.updateError', 'Failed to update internal user'),
            )
          },
        },
      )
    } else {
      // Create new user
      const payload = {
        ...data,
        clientId: undefined,
        supervisorId: undefined,
        status: UserStatus.PENDING,
        verificationUrl: `${window.location.origin}/verify?token=${Math.random().toString(36).substring(7)}`,
      }

      createUser(payload, {
        onSuccess: () => {
          toast.success(
            t(
              'internalUser.createSuccess',
              'Internal user created successfully',
            ),
          )
          form.reset()
          onOpenChange(false)
        },
        onError: (error: any) => {
          toast.error(
            error?.message ||
              t('internalUser.createError', 'Failed to create internal user'),
          )
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('internalUser.edit', 'Edit Internal User')
              : t('internalUser.create', 'Add Internal User')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t(
                  'internalUser.editDescription',
                  'Update the internal user information',
                )
              : t(
                  'internalUser.createDescription',
                  'Add a new internal user to the system',
                )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('internalUser.form.name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'internalUser.form.namePlaceholder',
                        'John Doe',
                      )}
                      {...field}
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
                  <FormLabel>{t('internalUser.form.email', 'Email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t(
                        'internalUser.form.emailPlaceholder',
                        'john@example.com',
                      )}
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
                    {t(
                      'internalUser.form.password',
                      isEditing
                        ? 'Password (leave empty to keep current)'
                        : 'Password',
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t(
                          'internalUser.form.passwordPlaceholder',
                          '********',
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
                  <FormLabel>{t('internalUser.form.phone', 'Phone')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'internalUser.form.phonePlaceholder',
                        '+62812345678',
                      )}
                      {...field}
                    />
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
                  <FormLabel>{t('internalUser.form.role', 'Role')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'internalUser.form.rolePlaceholder',
                            'Select role',
                          )}
                        />
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? t('common.updating', 'Updating...')
                    : t('common.creating', 'Creating...')
                  : isEditing
                    ? t('common.update', 'Update')
                    : t('common.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
