import { createFileRoute } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

import {
  useAiProviders,
  useCreateAiProvider,
  useUpdateAiProvider,
  useDeleteAiProvider,
} from '@/hooks/api/useAiProviders'
import { useDebounce } from '@/hooks/useDebounce'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Plus,
  Eye,
  EyeOff,
  Layers,
  Loader2,
} from 'lucide-react'
import type { AiProvider } from '@/lib/api/types/ai-providers.types'
import { StandardPagination } from '@/components/common/StandardPagination'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ViewModelsSheet } from '@/components/settings/ViewModelsSheet'

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  slug: z
    .string()
    .min(2, {
      message: 'Slug must be at least 2 characters.',
    })
    .regex(/^[a-z0-9-]+$/, {
      message:
        'Slug must contain only lowercase letters, numbers, and hyphens.',
    }),
  apiBaseUrl: z.string().url({
    message: 'Please enter a valid URL.',
  }),
  apiKey: z.string().min(1, {
    message: 'API Key is required.',
  }),
  isActive: z.boolean(),
})

type AiProviderFormValues = z.infer<typeof formSchema>

interface AiProviderFormProps {
  defaultValues?: Partial<AiProviderFormValues>
  onSubmit: (values: AiProviderFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
}

function AiProviderForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: AiProviderFormProps) {
  const { t } = useTranslation()
  const form = useForm<AiProviderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      apiBaseUrl: '',
      apiKey: '',
      isActive: true,
      ...defaultValues,
    },
  })

  // Reset form when defaultValues change (important for Edit mode)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || '',
        slug: defaultValues.slug || '',
        apiBaseUrl: defaultValues.apiBaseUrl || '',
        apiKey: (defaultValues as any).apiKey || '',
        isActive: defaultValues.isActive ?? true,
      })
    } else {
      form.reset({
        name: '',
        slug: '',
        apiBaseUrl: '',
        apiKey: '',
        isActive: true,
      })
    }
  }, [defaultValues, form])

  const [showApiKeyInForm, setShowApiKeyInForm] = useState(false)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('aiProvider.form.name', 'Name')}</FormLabel>
              <FormControl>
                <Input placeholder="OpenAI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('aiProvider.form.slug', 'Slug')}</FormLabel>
              <FormControl>
                <Input placeholder="openai" {...field} />
              </FormControl>
              <FormDescription>
                {t(
                  'aiProvider.form.slugDescription',
                  'Unique identifier for the provider.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiBaseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('aiProvider.form.apiBaseUrl', 'API Base URL')}
              </FormLabel>
              <FormControl>
                <Input placeholder="https://api.openai.com/v1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('aiProvider.form.apiKey', 'API Key')}</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showApiKeyInForm ? 'text' : 'password'}
                    placeholder="sk-..."
                    {...field}
                    className="pr-10"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKeyInForm(!showApiKeyInForm)}
                >
                  {showApiKeyInForm ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t('aiProvider.form.isActive', 'Active')}
                </FormLabel>
                <FormDescription>
                  {t(
                    'aiProvider.form.isActiveDescription',
                    'Enable or disable this provider.',
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export const Route = createFileRoute('/dashboard/settings/ai-provider/')({
  component: AiProviderPage,
})

function AiProviderPage(): React.ReactElement {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState('')
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [deletingProvider, setDeletingProvider] = useState<AiProvider | null>(
    null,
  )
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(
    null,
  )
  const [viewingModelsProvider, setViewingModelsProvider] =
    useState<AiProvider | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 500)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const { data, isLoading, error } = useAiProviders({
    page,
    limit: itemsPerPage,
  })
  const { mutate: createProvider, isPending: isCreating } =
    useCreateAiProvider()
  const { mutate: updateProvider, isPending: isUpdating } =
    useUpdateAiProvider()
  const { mutate: deleteProvider } = useDeleteAiProvider()

  const handleDelete = (provider: AiProvider): void => {
    setDeletingProvider(provider)
  }

  const confirmDelete = (): void => {
    if (deletingProvider) {
      deleteProvider(deletingProvider.id, {
        onSuccess: () => {
          toast.success(
            t('aiProvider.deleteSuccess', 'AI Provider deleted successfully'),
          )
          setDeletingProvider(null)
        },
        onError: (error: Error) => {
          toast.error(
            error?.message ||
              t('aiProvider.deleteError', 'Failed to delete AI Provider'),
          )
        },
      })
    }
  }

  const handleEdit = (provider: AiProvider): void => {
    setEditingProvider(provider)
  }

  const handleCreate = (): void => {
    setIsAddOpen(true)
  }

  const handleUpsert = (values: any): void => {
    if (editingProvider) {
      updateProvider(
        { id: editingProvider.id, data: values },
        {
          onSuccess: () => {
            toast.success(
              t('aiProvider.updateSuccess', 'AI Provider updated successfully'),
            )
            setEditingProvider(null)
          },
          onError: (error: Error) => {
            toast.error(
              error?.message ||
                t('aiProvider.updateError', 'Failed to update AI Provider'),
            )
          },
        },
      )
    } else {
      createProvider(values, {
        onSuccess: () => {
          toast.success(
            t('aiProvider.createSuccess', 'AI Provider created successfully'),
          )
          setIsAddOpen(false)
        },
        onError: (error: Error) => {
          toast.error(
            error?.message ||
              t('aiProvider.createError', 'Failed to create AI Provider'),
          )
        },
      })
    }
  }

  const toggleApiKeyVisibility = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    setShowApiKey((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const maskApiKey = (key: string): string => {
    if (!key) return '-'
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '••••••••' + key.slice(-4)
  }

  // Filter data based on search
  const providers = data?.data ?? []
  const filteredData = providers.filter((provider) => {
    if (!debouncedSearch) return true
    const searchLower = debouncedSearch.toLowerCase()
    return (
      provider.name.toLowerCase().includes(searchLower) ||
      provider.slug.toLowerCase().includes(searchLower)
    )
  })

  if (error) {
    return (
      <RoleGuard allowedRoles={['superadmin']}>
        <div className="p-4 text-red-500">
          {t('aiProvider.error', 'Error loading AI providers')}
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {t('aiProvider.title', 'AI Providers')}
          </h1>
          <Button
            onClick={() => {
              console.log('Add Provider button clicked!')
              setIsAddOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('aiProvider.addNew', 'Add Provider')}
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                'aiProvider.searchPlaceholder',
                'Search providers...',
              )}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
              }}
              className="pl-8"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !filteredData || filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
            <h3 className="text-lg font-semibold">
              {t('aiProvider.empty.title', 'No AI Providers Found')}
            </h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              {t(
                'aiProvider.empty.description',
                'No AI providers configured yet. Add a new provider to get started.',
              )}
            </p>
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleCreate()
              }}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('aiProvider.addNew', 'Add Provider')}
            </Button>
          </div>
        ) : (
          /* Manual Table Implementation - Matching Leads Page Pattern */
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] text-center font-semibold text-primary">
                    {t('common.no', '#')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('aiProvider.table.name', 'Name')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('aiProvider.table.slug', 'Slug')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('aiProvider.table.apiBaseUrl', 'API Base URL')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('aiProvider.table.apiKey', 'API Key')}
                  </TableHead>
                  <TableHead className="font-semibold text-primary">
                    {t('aiProvider.table.isActive', 'Status')}
                  </TableHead>
                  <TableHead className="text-right font-semibold text-primary">
                    {t('common.actions', 'Actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((provider, index) => (
                  <TableRow
                    key={provider.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(provider)}
                  >
                    <TableCell className="text-center">
                      {(page - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {provider.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {provider.slug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground font-mono text-sm truncate max-w-[200px]">
                        {provider.apiBaseUrl}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {showApiKey[provider.id]
                            ? provider.apiKeyEncrypted
                            : maskApiKey(provider.apiKeyEncrypted)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) =>
                            toggleApiKeyVisibility(provider.id, e)
                          }
                        >
                          {showApiKey[provider.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={provider.isActive ? 'default' : 'secondary'}
                      >
                        {provider.isActive
                          ? t('common.active', 'Active')
                          : t('common.inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {t('common.actions', 'Actions')}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setViewingModelsProvider(provider)
                            }}
                          >
                            <Layers className="mr-2 h-4 w-4" />
                            {t('aiProvider.viewModels', 'View Models')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(provider)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(provider)
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t('common.delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            {data && (
              <StandardPagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                totalItems={data.meta.total}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </div>

      <Dialog
        open={isAddOpen || !!editingProvider}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingProvider(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingProvider
                ? t('aiProvider.editTitle', 'Edit AI Provider')
                : t('aiProvider.createTitle', 'Add AI Provider')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'aiProvider.formDescription',
                'Configure your AI provider settings here.',
              )}
            </DialogDescription>
          </DialogHeader>
          <AiProviderForm
            defaultValues={
              editingProvider
                ? {
                    ...editingProvider,
                    apiKey: editingProvider.apiKeyEncrypted,
                  }
                : undefined
            }
            onSubmit={handleUpsert}
            onCancel={() => {
              setIsAddOpen(false)
              setEditingProvider(null)
            }}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingProvider}
        onOpenChange={(open) => !open && setDeletingProvider(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('aiProvider.deleteTitle', 'Delete AI Provider')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'aiProvider.deleteDescription',
                'Are you sure you want to delete this AI provider? This action cannot be undone.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Models Sheet */}
      <ViewModelsSheet
        open={!!viewingModelsProvider}
        onOpenChange={(open) => !open && setViewingModelsProvider(null)}
        provider={viewingModelsProvider}
      />
    </RoleGuard>
  )
}
