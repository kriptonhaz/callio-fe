import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Plus,
  Trash2,
  X,
  Undo2,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  LayoutSectionsJson,
  LayoutSectionConfig,
  LayoutFieldConfig,
} from '@/lib/api/types/layout-configs.types'
import {
  resolveFieldMeta,
  FIELD_REGISTRY,
  ALL_STANDARD_KEYS,
  CUSTOM_PREFIX,
  isCustomKey,
  customKeyName,
} from '@/lib/layout/field-registry'
import { getPlacedKeys, sortLayout } from '@/lib/layout/default-layout'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LayoutBuilderProps {
  scope: 'global' | 'campaign'
  initialLayout: LayoutSectionsJson
  discoveredCustomKeys?: string[]
  inherited?: boolean
  onSave: (layout: LayoutSectionsJson) => Promise<void> | void
  onReset?: () => Promise<void> | void
  isSaving?: boolean
  isResetting?: boolean
}

const PALETTE_ID = '__palette__'

function uuid(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function LayoutBuilder({
  scope,
  initialLayout,
  discoveredCustomKeys = [],
  inherited,
  onSave,
  onReset,
  isSaving,
  isResetting,
}: LayoutBuilderProps) {
  const [draft, setDraft] = useState<LayoutSectionsJson>(() =>
    sortLayout(initialLayout),
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const placed = useMemo(() => getPlacedKeys(draft), [draft])

  // All candidate keys = standard registry + discovered custom keys (per campaign)
  const allCandidateKeys = useMemo(() => {
    const customKeys = discoveredCustomKeys.map((k) => `${CUSTOM_PREFIX}${k}`)
    return Array.from(new Set([...ALL_STANDARD_KEYS, ...customKeys]))
  }, [discoveredCustomKeys])

  const paletteKeys = useMemo(
    () => allCandidateKeys.filter((k) => !placed.has(k)),
    [allCandidateKeys, placed],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // -------------------------------------------------------------------------
  // Section helpers
  // -------------------------------------------------------------------------

  const setSections = useCallback(
    (updater: (prev: LayoutSectionConfig[]) => LayoutSectionConfig[]) => {
      setDraft((prev) => ({
        ...prev,
        sections: updater(prev.sections).map((s, i) => ({ ...s, order: i })),
      }))
    },
    [],
  )

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: uuid(),
        title: `New Section`,
        order: prev.length,
        fields: [],
      },
    ])
  }

  const renameSection = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    )
  }

  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
  }

  const updateField = (
    sectionId: string,
    fieldKey: string,
    patch: Partial<LayoutFieldConfig>,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.key === fieldKey ? { ...f, ...patch } : f,
              ),
            }
          : s,
      ),
    )
  }

  const removeField = (sectionId: string, fieldKey: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.key !== fieldKey) }
          : s,
      ),
    )
  }

  // -------------------------------------------------------------------------
  // Drag handlers
  // -------------------------------------------------------------------------

  const findContainer = (id: string): string | null => {
    if (id === PALETTE_ID) return PALETTE_ID
    if (paletteKeys.includes(id)) return PALETTE_ID
    for (const sec of draft.sections) {
      if (sec.id === id) return sec.id
      if (sec.fields.some((f) => f.key === id)) return sec.id
    }
    return null
  }

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const activeKey = String(active.id)
    const overId = String(over.id)

    // Only handle field drags here (section drags handled in dragEnd).
    if (!isFieldId(activeKey, draft, paletteKeys)) return

    const from = findContainer(activeKey)
    const to = findContainer(overId)
    if (!from || !to || from === to) return

    // Moving between containers (palette <-> section or section <-> section)
    if (from === PALETTE_ID && to !== PALETTE_ID) {
      // Palette -> section: add field to target section
      const meta = resolveFieldMeta(activeKey)
      if (!meta) return
      setSections((prev) =>
        prev.map((s) =>
          s.id === to
            ? {
                ...s,
                fields: [
                  ...s.fields,
                  {
                    key: activeKey,
                    label: meta.defaultLabel,
                    editable: meta.defaultEditable,
                    order: s.fields.length,
                  },
                ],
              }
            : s,
        ),
      )
    } else if (from !== PALETTE_ID && to === PALETTE_ID) {
      // Section -> palette: remove from source section
      setSections((prev) =>
        prev.map((s) =>
          s.id === from
            ? { ...s, fields: s.fields.filter((f) => f.key !== activeKey) }
            : s,
        ),
      )
    } else if (from !== PALETTE_ID && to !== PALETTE_ID) {
      // Section -> another section: move field
      setDraft((prev) => {
        const sourceSec = prev.sections.find((s) => s.id === from)
        const field = sourceSec?.fields.find((f) => f.key === activeKey)
        if (!field) return prev
        return {
          ...prev,
          sections: prev.sections.map((s) => {
            if (s.id === from) {
              return {
                ...s,
                fields: s.fields.filter((f) => f.key !== activeKey),
              }
            }
            if (s.id === to) {
              return { ...s, fields: [...s.fields, field] }
            }
            return s
          }),
        }
      })
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)

    // Section-to-section reorder (when dragging a section)
    if (isSectionId(activeId, draft) && isSectionId(overId, draft)) {
      if (activeId === overId) return
      setSections((prev) => {
        const oldIdx = prev.findIndex((s) => s.id === activeId)
        const newIdx = prev.findIndex((s) => s.id === overId)
        if (oldIdx < 0 || newIdx < 0) return prev
        return arrayMove(prev, oldIdx, newIdx)
      })
      return
    }

    // Field reorder within same section
    const fromSec = findContainer(activeId)
    const toSec = findContainer(overId)
    if (
      fromSec &&
      fromSec === toSec &&
      fromSec !== PALETTE_ID &&
      activeId !== overId
    ) {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== fromSec) return s
          const oldIdx = s.fields.findIndex((f) => f.key === activeId)
          const newIdx = s.fields.findIndex((f) => f.key === overId)
          if (oldIdx < 0 || newIdx < 0) return s
          const next = arrayMove(s.fields, oldIdx, newIdx).map((f, i) => ({
            ...f,
            order: i,
          }))
          return { ...s, fields: next }
        }),
      )
    }
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    // Trim empty sections? Backend allows min 1 field per section — warn.
    const empty = draft.sections.filter((s) => s.fields.length === 0)
    if (empty.length > 0) {
      toast.error(
        `Each section must contain at least one field. Empty: ${empty
          .map((s) => s.title)
          .join(', ')}`,
      )
      return
    }
    // Normalize orders before sending.
    const normalized: LayoutSectionsJson = {
      ...draft,
      sections: draft.sections.map((s, i) => ({
        ...s,
        order: i,
        fields: s.fields.map((f, j) => ({ ...f, order: j })),
      })),
    }
    await onSave(normalized)
  }

  const handleReset = async () => {
    if (!onReset) return
    await onReset()
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const activeField =
    activeId && isFieldId(activeId, draft, paletteKeys)
      ? activeId
      : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        {inherited && scope === 'campaign' && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              This campaign currently uses the default layout. Saving creates
              an override just for this campaign.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <FieldPalette paletteKeys={paletteKeys} />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <SortableContext
              items={draft.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {draft.sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onRename={(t) => renameSection(section.id, t)}
                  onDelete={() => deleteSection(section.id)}
                  onUpdateField={(fieldKey, patch) =>
                    updateField(section.id, fieldKey, patch)
                  }
                  onRemoveField={(fieldKey) =>
                    removeField(section.id, fieldKey)
                  }
                />
              ))}
            </SortableContext>

            <Button variant="outline" onClick={addSection} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Section
            </Button>

            <div className="flex items-center gap-2 justify-end pt-4 border-t">
              {scope === 'campaign' && onReset && !inherited && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="gap-2"
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="h-4 w-4" />
                  )}
                  Reset to Default
                </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Layout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeField ? (
          <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-lg">
            {resolveFieldMeta(activeField)?.defaultLabel ?? activeField}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSectionId(id: string, layout: LayoutSectionsJson): boolean {
  return layout.sections.some((s) => s.id === id)
}

function isFieldId(
  id: string,
  layout: LayoutSectionsJson,
  paletteKeys: string[],
): boolean {
  if (paletteKeys.includes(id)) return true
  return layout.sections.some((s) => s.fields.some((f) => f.key === id))
}

// ---------------------------------------------------------------------------
// FieldPalette
// ---------------------------------------------------------------------------

function FieldPalette({ paletteKeys }: { paletteKeys: string[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: PALETTE_ID })

  return (
    <Card
      ref={setNodeRef}
      className={isOver ? 'border-primary' : undefined}
    >
      <CardHeader className="pb-2">
        <div className="text-sm font-medium">Available Fields</div>
        <div className="text-xs text-muted-foreground">
          Drag into a section to use it
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {paletteKeys.length === 0 && (
          <div className="text-xs text-muted-foreground py-2">
            All fields placed.
          </div>
        )}
        <SortableContext
          items={paletteKeys}
          strategy={verticalListSortingStrategy}
        >
          {paletteKeys.map((key) => (
            <PaletteItem key={key} fieldKey={key} />
          ))}
        </SortableContext>
      </CardContent>
    </Card>
  )
}

function PaletteItem({ fieldKey }: { fieldKey: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: fieldKey })

  const meta = resolveFieldMeta(fieldKey)
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="truncate flex-1">
        {meta?.defaultLabel ?? fieldKey}
      </span>
      {isCustomKey(fieldKey) && (
        <Badge variant="secondary" className="text-[10px] h-5">
          custom
        </Badge>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SectionCard
// ---------------------------------------------------------------------------

function SectionCard({
  section,
  onRename,
  onDelete,
  onUpdateField,
  onRemoveField,
}: {
  section: LayoutSectionConfig
  onRename: (title: string) => void
  onDelete: () => void
  onUpdateField: (fieldKey: string, patch: Partial<LayoutFieldConfig>) => void
  onRemoveField: (fieldKey: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id })

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: section.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const fieldIds = section.fields.map((f) => f.key)

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        ref={setDropRef}
        className={isOver ? 'border-primary' : undefined}
      >
        <CardHeader className="pb-3 flex-row items-center gap-2 space-y-0">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Drag section"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Input
            value={section.title}
            onChange={(e) => onRename(e.target.value)}
            className="h-8 text-base font-medium"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {section.fields.length === 0 && (
            <div className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-md">
              Drop fields here
            </div>
          )}
          <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
            {section.fields.map((field) => (
              <FieldRow
                key={field.key}
                field={field}
                onUpdate={(patch) => onUpdateField(field.key, patch)}
                onRemove={() => onRemoveField(field.key)}
              />
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FieldRow
// ---------------------------------------------------------------------------

function FieldRow({
  field,
  onUpdate,
  onRemove,
}: {
  field: LayoutFieldConfig
  onUpdate: (patch: Partial<LayoutFieldConfig>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.key })

  const meta = resolveFieldMeta(field.key)
  const deprecated = !meta
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const switchId = `editable-${field.key}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-background px-2 py-2"
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Drag field"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="h-7 text-sm"
          placeholder={meta?.defaultLabel ?? field.key}
        />
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="font-mono truncate">{field.key}</span>
          {meta && !isCustomKey(field.key) && FIELD_REGISTRY[field.key] && (
            <Badge variant="outline" className="text-[10px] h-4">
              {meta.type}
            </Badge>
          )}
          {isCustomKey(field.key) && (
            <Badge variant="secondary" className="text-[10px] h-4">
              custom
            </Badge>
          )}
          {deprecated && (
            <Badge variant="destructive" className="text-[10px] h-4">
              deprecated
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Label
          htmlFor={switchId}
          className="text-[10px] text-muted-foreground cursor-pointer"
        >
          Editable
        </Label>
        <Switch
          id={switchId}
          checked={field.editable}
          onCheckedChange={(v) => onUpdate({ editable: v })}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        aria-label="Remove field"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// Also export helper for campaign-detail placement
export function customKeyDisplay(key: string): string {
  return isCustomKey(key) ? customKeyName(key) : key
}
