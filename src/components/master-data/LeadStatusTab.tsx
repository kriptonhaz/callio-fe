import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { ColorSwatchPicker } from './ColorSwatchPicker'
import type {DragEndEvent} from '@dnd-kit/core';
import type {
  LeadStatusColor,
  LeadStatusOption,
} from '@/lib/api/types/lead-status-options.types'
import {
  useCreateLeadStatusOption,
  useDeleteLeadStatusOption,
  useLeadStatusOptions,
  useUpdateLeadStatusOption,
} from '@/hooks/api/useLeadStatusOptions'
import { colorClasses } from '@/lib/lead-status/palette'
import { slugify } from '@/lib/lead-status/constants'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { cn } from '@/lib/utils'

export function LeadStatusTab() {
  const { data, isLoading, error } = useLeadStatusOptions()
  const updateMut = useUpdateLeadStatusOption()
  const createMut = useCreateLeadStatusOption()
  const deleteMut = useDeleteLeadStatusOption()

  const [editing, setEditing] = useState<LeadStatusOption | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<LeadStatusOption | null>(
    null,
  )

  // Local order draft for drag-and-drop. Synced to server data when not dragging.
  const [localOrder, setLocalOrder] = useState<Array<LeadStatusOption> | null>(null)
  useEffect(() => {
    setLocalOrder(null)
  }, [data])

  const rows = useMemo(() => {
    if (localOrder) return localOrder
    return [...(data ?? [])].sort((a, b) => a.order - b.order)
  }, [data, localOrder])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = rows.findIndex((r) => r.id === active.id)
    const newIdx = rows.findIndex((r) => r.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return
    const next = arrayMove(rows, oldIdx, newIdx)
    setLocalOrder(next)
    // Persist new order for any row whose order changed.
    next.forEach((row, i) => {
      if (row.order !== i) {
        updateMut.mutate(
          { id: row.id, data: { order: i } },
          {
            onError: () => {
              toast.error('Failed to save order')
              setLocalOrder(null)
            },
          },
        )
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        Failed to load: {error.message}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lead Status</h2>
          <p className="text-sm text-muted-foreground">
            Manage the outcome statuses agents pick from. Renaming or
            deactivating a status keeps existing leads displaying it correctly.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Status
        </Button>
      </div>

      <div className="rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rows.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                onEdit={() => setEditing(row)}
                onDelete={() => setConfirmDelete(row)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {rows.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No statuses yet.
          </div>
        )}
      </div>

      {(creating || editing) && (
        <StatusDialog
          mode={creating ? 'create' : 'edit'}
          option={editing}
          existingSlugs={new Set(rows.map((r) => r.slug))}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSubmitCreate={(payload) => createMut.mutateAsync(payload)}
          onSubmitUpdate={(payload) =>
            editing
              ? updateMut.mutateAsync({ id: editing.id, data: payload })
              : Promise.reject(new Error('No row to update'))
          }
        />
      )}

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this status?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.label}" will be hidden from future status
              dropdowns. Existing leads currently set to this status will
              still display it correctly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (!confirmDelete) return
                deleteMut.mutate(confirmDelete.id, {
                  onSuccess: () => {
                    toast.success('Status deactivated')
                    setConfirmDelete(null)
                  },
                  onError: (err) => toast.error(err.message),
                })
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Deactivating…' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function Row({
  row,
  onEdit,
  onDelete,
}: {
  row: LeadStatusOption
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 border-b last:border-b-0 px-3 py-2.5',
        !row.isActive && 'opacity-60',
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
          colorClasses[row.color],
        )}
      >
        {row.label}
      </span>

      <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
        {row.slug}
      </code>

      <div className="flex items-center gap-2 text-xs">
        {row.isSystem && (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            <Lock className="h-3 w-3" />
            system
          </span>
        )}
        {!row.isActive && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            inactive
          </span>
        )}
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        className="h-8 w-8 p-0"
        aria-label="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        disabled={row.isSystem || !row.isActive}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        aria-label={
          row.isSystem
            ? 'System statuses cannot be deactivated'
            : 'Deactivate'
        }
        title={
          row.isSystem
            ? 'System statuses cannot be deactivated'
            : !row.isActive
              ? 'Already inactive'
              : undefined
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dialog (create/edit)
// ---------------------------------------------------------------------------

interface DialogProps {
  mode: 'create' | 'edit'
  option: LeadStatusOption | null
  existingSlugs: Set<string>
  onClose: () => void
  onSubmitCreate: (payload: {
    label: string
    slug?: string
    color: LeadStatusColor
  }) => Promise<unknown>
  onSubmitUpdate: (payload: {
    label?: string
    color?: LeadStatusColor
    isActive?: boolean
  }) => Promise<unknown>
}

function StatusDialog({
  mode,
  option,
  existingSlugs,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: DialogProps) {
  const [label, setLabel] = useState(option?.label ?? '')
  const [slug, setSlug] = useState(option?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(false)
  const [color, setColor] = useState<LeadStatusColor>(option?.color ?? 'blue')
  const [isActive, setIsActive] = useState(option?.isActive ?? true)
  const [submitting, setSubmitting] = useState(false)

  // Auto-generate slug from label until user manually edits it.
  useEffect(() => {
    if (mode === 'create' && !slugTouched) {
      setSlug(slugify(label))
    }
  }, [label, mode, slugTouched])

  const slugValid = /^[a-z0-9_-]{1,64}$/.test(slug)
  const slugConflict =
    mode === 'create' && slug && existingSlugs.has(slug)
      ? `Slug "${slug}" already exists`
      : null

  const canSubmit =
    label.trim().length > 0 &&
    (mode === 'edit' || (slug.length > 0 && slugValid && !slugConflict))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (mode === 'create') {
        await onSubmitCreate({
          label: label.trim(),
          slug: slug || undefined,
          color,
        })
        toast.success('Status created')
      } else {
        await onSubmitUpdate({
          label: label.trim(),
          color,
          isActive,
        })
        toast.success('Status updated')
      }
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Status' : 'Edit Status'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new outcome status agents can pick from.'
              : option?.isSystem
                ? 'This is a system status — slug is locked. You can change the label and color.'
                : 'Update display label, color, or active state. The slug is permanent.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status-label">Label</Label>
            <Input
              id="status-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={64}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status-slug">
              Slug
              {(mode === 'edit' || option?.isSystem) && (
                <span className="ml-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  immutable
                </span>
              )}
            </Label>
            <Input
              id="status-slug"
              value={slug}
              disabled={mode === 'edit'}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
              }}
              placeholder="auto-generated from label"
              className="font-mono text-sm"
            />
            {mode === 'create' && slug && !slugValid && (
              <p className="text-xs text-destructive">
                Lowercase letters, numbers, hyphens or underscores only.
              </p>
            )}
            {slugConflict && (
              <p className="text-xs text-destructive">{slugConflict}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>

          {mode === 'edit' && !option?.isSystem && (
            <div className="flex items-center justify-between">
              <Label htmlFor="status-active">Active</Label>
              <input
                id="status-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
