import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Loader2, Mail, MoreHorizontal, Pencil, Plus, Search, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { EmailTemplate } from '@/lib/api/types/email.types'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { StandardPagination } from '@/components/common/StandardPagination'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useDeleteEmailTemplate,
  useEmailTemplates,
} from '@/hooks/api/useEmailTemplates'

interface Props {
  onCreate: () => void
  onEdit: (template: EmailTemplate) => void
  onBlast: (template: EmailTemplate) => void
}

export function EmailTemplatesList({ onCreate, onEdit, onBlast }: Props) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [pendingDelete, setPendingDelete] = useState<EmailTemplate | null>(null)

  const limit = 10
  const { data, isLoading } = useEmailTemplates({
    page,
    limit,
    search: debouncedSearch || undefined,
  })
  const { mutate: deleteTemplate, isPending: isDeleting } =
    useDeleteEmailTemplate()

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    deleteTemplate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(
          t('email.templates.deleted', 'Template deleted successfully'),
        )
        setPendingDelete(null)
      },
      onError: () => {
        toast.error(
          t('email.templates.deleteFailed', 'Failed to delete template'),
        )
      },
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('email.templates.title', 'Email Templates')}
            </CardTitle>
            <Button onClick={onCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('email.templates.new', 'New Template')}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                'email.templates.searchPlaceholder',
                'Search templates by name…',
              )}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <TableRow>
                <TableHead className="font-semibold text-primary">
                  {t('email.templates.name', 'Name')}
                </TableHead>
                <TableHead className="font-semibold text-primary">
                  {t('email.templates.subject', 'Subject')}
                </TableHead>
                <TableHead className="font-semibold text-primary">
                  {t('email.templates.updated', 'Updated')}
                </TableHead>
                <TableHead className="text-right font-semibold text-primary">
                  {t('common.actions', 'Actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.loading', 'Loading…')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (data?.data.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Mail className="h-8 w-8" />
                      <p>
                        {t(
                          'email.templates.empty',
                          'No templates yet. Create your first one.',
                        )}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((tpl) => (
                  <TableRow
                    key={tpl.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => onEdit(tpl)}
                  >
                    <TableCell className="font-medium">{tpl.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tpl.subject}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(() => {
                        try {
                          return format(new Date(tpl.updatedAt), 'dd MMM yyyy HH:mm')
                        } catch {
                          return tpl.updatedAt
                        }
                      })()}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5"
                          onClick={() => onBlast(tpl)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {t('email.templates.sendBlast', 'Send Blast')}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(tpl)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t('common.edit', 'Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setPendingDelete(tpl)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete', 'Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {data && (
            <StandardPagination
              currentPage={page}
              totalPages={data.meta.totalPages}
              totalItems={data.meta.total}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          )}
        </div>
      </CardContent>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('email.templates.confirmDeleteTitle', 'Delete template?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'email.templates.confirmDeleteDescription',
                'Are you sure you want to delete "{{name}}"? This cannot be undone.',
                { name: pendingDelete?.name ?? '' },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
