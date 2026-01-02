import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  useAiModels,
  useCreateAiModel,
  useUpdateAiModel,
  useDeleteAiModel,
} from '@/hooks/api/useAiModels'
import type { AiProvider } from '@/lib/api/types/ai-providers.types'
import type { AiModel } from '@/lib/api/types/ai-models.types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Plus, MoreHorizontal, Edit, Trash, Loader2, Cpu } from 'lucide-react'

// AI Model capabilities
const CAPABILITIES = [
  'transcription',
  'generation',
  'sentiment',
  'chat',
  'auto_reply',
] as const

// Form schema
const modelFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  modelId: z.string().min(2, {
    message: 'Model ID must be at least 2 characters.',
  }),
  description: z.string().optional(),
  capabilities: z.array(z.string()).min(1, {
    message: 'Select at least one capability.',
  }),
  inputPricePerToken: z.number().min(0, {
    message: 'Price must be 0 or greater.',
  }),
  outputPricePerToken: z.number().min(0, {
    message: 'Price must be 0 or greater.',
  }),
  maxContextTokens: z.number().int().min(1, {
    message: 'Context tokens must be at least 1.',
  }),
  isActive: z.boolean(),
})

type ModelFormValues = z.infer<typeof modelFormSchema>

interface ViewModelsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: AiProvider | null
}

export function ViewModelsSheet({
  open,
  onOpenChange,
  provider,
}: ViewModelsSheetProps): React.ReactElement | null {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<AiModel | null>(null)
  const [deletingModel, setDeletingModel] = useState<AiModel | null>(null)
  const [inputPriceStr, setInputPriceStr] = useState('')
  const [outputPriceStr, setOutputPriceStr] = useState('')

  // Fetch models for this provider
  const { data, isLoading } = useAiModels(
    { providerId: provider?.id, limit: 100 },
    open && !!provider?.id,
  )

  const { mutate: createModel, isPending: isCreating } = useCreateAiModel()
  const { mutate: updateModel, isPending: isUpdating } = useUpdateAiModel()
  const { mutate: deleteModel } = useDeleteAiModel()

  const models = data?.data ?? []

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: '',
      modelId: '',
      description: '',
      capabilities: [],
      inputPricePerToken: 0,
      outputPricePerToken: 0,
      maxContextTokens: 4096,
      isActive: true,
    },
  })

  // Reset form when editing model changes
  useEffect(() => {
    if (editingModel) {
      const inputPrice =
        typeof editingModel.inputPricePerToken === 'string'
          ? parseFloat(editingModel.inputPricePerToken)
          : editingModel.inputPricePerToken
      const outputPrice =
        typeof editingModel.outputPricePerToken === 'string'
          ? parseFloat(editingModel.outputPricePerToken)
          : editingModel.outputPricePerToken
      form.reset({
        name: editingModel.name,
        modelId: editingModel.modelId,
        description: editingModel.description || '',
        capabilities: editingModel.capabilities,
        inputPricePerToken: inputPrice,
        outputPricePerToken: outputPrice,
        maxContextTokens: editingModel.maxContextTokens,
        isActive: editingModel.isActive,
      })
      setInputPriceStr(inputPrice.toString())
      setOutputPriceStr(outputPrice.toString())
    } else {
      form.reset({
        name: '',
        modelId: '',
        description: '',
        capabilities: [],
        inputPricePerToken: 0,
        outputPricePerToken: 0,
        maxContextTokens: 4096,
        isActive: true,
      })
      setInputPriceStr('0')
      setOutputPriceStr('0')
    }
  }, [editingModel, form])

  const handleOpenForm = (): void => {
    setEditingModel(null)
    setIsFormOpen(true)
  }

  const handleEdit = (model: AiModel): void => {
    setEditingModel(model)
    setIsFormOpen(true)
  }

  const handleCloseForm = (): void => {
    setIsFormOpen(false)
    setEditingModel(null)
    form.reset()
  }

  const handleSubmit = (values: ModelFormValues): void => {
    if (!provider) return

    if (editingModel) {
      updateModel(
        { id: editingModel.id, data: values },
        {
          onSuccess: () => {
            toast.success(
              t('aiModels.updateSuccess', 'Model updated successfully'),
            )
            handleCloseForm()
          },
          onError: (error: Error) => {
            toast.error(
              error?.message ||
                t('aiModels.updateError', 'Failed to update model'),
            )
          },
        },
      )
    } else {
      createModel(
        { ...values, providerId: provider.id },
        {
          onSuccess: () => {
            toast.success(
              t('aiModels.createSuccess', 'Model created successfully'),
            )
            handleCloseForm()
          },
          onError: (error: Error) => {
            toast.error(
              error?.message ||
                t('aiModels.createError', 'Failed to create model'),
            )
          },
        },
      )
    }
  }

  const confirmDelete = (): void => {
    if (deletingModel) {
      deleteModel(deletingModel.id, {
        onSuccess: () => {
          toast.success(
            t('aiModels.deleteSuccess', 'Model deleted successfully'),
          )
          setDeletingModel(null)
        },
        onError: (error: Error) => {
          toast.error(
            error?.message ||
              t('aiModels.deleteError', 'Failed to delete model'),
          )
        },
      })
    }
  }

  const toggleCapability = (capability: string): void => {
    const current = form.getValues('capabilities')
    if (current.includes(capability)) {
      form.setValue(
        'capabilities',
        current.filter((c) => c !== capability),
        { shouldValidate: true },
      )
    } else {
      form.setValue('capabilities', [...current, capability], {
        shouldValidate: true,
      })
    }
  }

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return `$${numPrice.toFixed(6)}`
  }

  if (!provider) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl flex flex-col p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              {t('aiModels.title', 'Models for {{name}}', {
                name: provider.name,
              })}
            </SheetTitle>
            <SheetDescription>
              {t(
                'aiModels.description',
                'Manage AI models available for this provider.',
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Add Button */}
            <div className="flex justify-end mb-4">
              <Button onClick={handleOpenForm}>
                <Plus className="mr-2 h-4 w-4" />
                {t('aiModels.addNew', 'Add Model')}
              </Button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
                <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">
                  {t('aiModels.empty.title', 'No Models Found')}
                </h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  {t(
                    'aiModels.empty.description',
                    'No models configured for this provider yet. Add a new model to get started.',
                  )}
                </p>
                <Button onClick={handleOpenForm} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('aiModels.addNew', 'Add Model')}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-primary">
                        {t('aiModels.table.name', 'Name')}
                      </TableHead>
                      <TableHead className="font-semibold text-primary">
                        {t('aiModels.table.modelId', 'Model ID')}
                      </TableHead>
                      <TableHead className="font-semibold text-primary">
                        {t('aiModels.table.capabilities', 'Capabilities')}
                      </TableHead>
                      <TableHead className="font-semibold text-primary">
                        {t('aiModels.table.pricing', 'Pricing (per token)')}
                      </TableHead>
                      <TableHead className="font-semibold text-primary">
                        {t('aiModels.table.status', 'Status')}
                      </TableHead>
                      <TableHead className="text-right font-semibold text-primary">
                        {t('common.actions', 'Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow
                        key={model.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEdit(model)}
                      >
                        <TableCell className="font-medium">
                          {model.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {model.modelId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {model.capabilities.slice(0, 2).map((cap) => (
                              <Badge
                                key={cap}
                                variant="secondary"
                                className="text-xs"
                              >
                                {cap}
                              </Badge>
                            ))}
                            {model.capabilities.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{model.capabilities.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-muted-foreground">In:</span>{' '}
                              {formatPrice(model.inputPricePerToken)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Out:
                              </span>{' '}
                              {formatPrice(model.outputPricePerToken)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={model.isActive ? 'default' : 'secondary'}
                          >
                            {model.isActive
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
                                  handleEdit(model)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit', 'Edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeletingModel(model)
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
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Model Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModel
                ? t('aiModels.editTitle', 'Edit Model')
                : t('aiModels.createTitle', 'Add New Model')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'aiModels.formDescription',
                'Configure the AI model settings here.',
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('aiModels.form.name', 'Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="GPT-4 Turbo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('aiModels.form.modelId', 'Model ID')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="gpt-4-turbo" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'aiModels.form.modelIdDescription',
                        'The identifier used when calling the API.',
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('aiModels.form.description', 'Description')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          'aiModels.form.descriptionPlaceholder',
                          'Optional description...',
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
                name="capabilities"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      {t('aiModels.form.capabilities', 'Capabilities')}
                    </FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {CAPABILITIES.map((cap) => {
                        const isSelected = form
                          .watch('capabilities')
                          .includes(cap)
                        return (
                          <Badge
                            key={cap}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleCapability(cap)}
                          >
                            {cap}
                          </Badge>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="inputPricePerToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('aiModels.form.inputPrice', 'Input Price')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00001"
                          value={inputPriceStr}
                          onChange={(e) => {
                            const value = e.target.value.replace(',', '.')
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setInputPriceStr(value)
                            }
                          }}
                          onBlur={() => {
                            const num = parseFloat(inputPriceStr) || 0
                            field.onChange(num)
                            setInputPriceStr(num.toString())
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {t('aiModels.form.per1MTokens', '$ per 1M tokens')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="outputPricePerToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('aiModels.form.outputPrice', 'Output Price')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00003"
                          value={outputPriceStr}
                          onChange={(e) => {
                            const value = e.target.value.replace(',', '.')
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setOutputPriceStr(value)
                            }
                          }}
                          onBlur={() => {
                            const num = parseFloat(outputPriceStr) || 0
                            field.onChange(num)
                            setOutputPriceStr(num.toString())
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {t('aiModels.form.per1MTokens', '$ per 1M tokens')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxContextTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        'aiModels.form.maxContextTokens',
                        'Max Context Tokens',
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="4096"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? 0
                              : parseInt(e.target.value, 10),
                          )
                        }
                      />
                    </FormControl>
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
                        {t('aiModels.form.isActive', 'Active')}
                      </FormLabel>
                      <FormDescription>
                        {t(
                          'aiModels.form.isActiveDescription',
                          'Enable or disable this model.',
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('common.save', 'Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingModel}
        onOpenChange={(open) => !open && setDeletingModel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('aiModels.deleteTitle', 'Delete Model')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'aiModels.deleteDescription',
                'Are you sure you want to delete this model? This action cannot be undone.',
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
    </>
  )
}
