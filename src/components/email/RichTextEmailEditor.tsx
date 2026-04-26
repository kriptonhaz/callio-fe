import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {  EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
  Variable,
} from 'lucide-react'
import type {Editor} from '@tiptap/react';
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { EMAIL_TEMPLATE_VARIABLES } from '@/lib/email/template-variables'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

// True when the HTML carries structural / style markup that the visual editor
// would silently strip (TipTap only retains content nodes).
function hasFullDocumentMarkup(html: string): boolean {
  return /<\s*(style|html|head|!doctype|link\b)/i.test(html)
}

export function RichTextEmailEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 320,
}: Props) {
  const { t } = useTranslation()
  const isFullDoc = hasFullDocumentMarkup(value)
  const [showSource, setShowSource] = useState(isFullDoc)

  // Force source mode whenever the value contains structural markup so we
  // don't silently lose the user's styles.
  useEffect(() => {
    if (isFullDoc && !showSource) setShowSource(true)
  }, [isFullDoc, showSource])

  // Editor's onUpdate runs in a stable closure — read isFullDoc through a ref
  // so we can short-circuit it without rebuilding the editor.
  const isFullDocRef = useRef(isFullDoc)
  isFullDocRef.current = isFullDoc

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder:
          placeholder ??
          t(
            'email.templates.editor.placeholder',
            'Write your email here…',
          ),
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-3',
          'min-h-[var(--editor-min-h)]',
        ),
        style: `--editor-min-h: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      // When the form value is a full HTML document, the visual editor is
      // hidden and locked; ignore any updates it emits so its lossy
      // (style-stripped) HTML can't leak back into the form.
      if (isFullDocRef.current) return
      onChange(ed.getHTML())
    },
  })

  // Sync external value changes (e.g. when loading a template into the form
  // or after a "View Source" round-trip). Skip when the editor itself is the
  // source of the change. CRUCIAL: skip entirely when the value is a full
  // document — TipTap parses content eagerly and strips <style>/<head> tags,
  // which we'd then risk leaking back into the form.
  useEffect(() => {
    if (!editor) return
    if (isFullDoc) return
    const current = editor.getHTML()
    if (value !== current && !editor.isFocused) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor, isFullDoc])

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-md border bg-muted/30 animate-pulse',
          className,
        )}
        style={{ minHeight }}
      />
    )
  }

  return (
    <div className={cn('rounded-md border overflow-hidden', className)}>
      <Toolbar
        editor={editor}
        showSource={showSource}
        onToggleSource={() => setShowSource((s) => !s)}
        sourceLocked={isFullDoc}
      />
      {isFullDoc && (
        <div className="border-t bg-amber-50 text-amber-900 text-xs px-3 py-1.5">
          {t(
            'email.templates.editor.fullDocLocked',
            'This template contains <style> or document tags. Visual editing is disabled to preserve your styles — keep using View Source.',
          )}
        </div>
      )}
      {showSource ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs rounded-none border-0 border-t resize-none"
          style={{ minHeight }}
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} className="border-t" />
      )}
    </div>
  )
}

interface ToolbarProps {
  editor: Editor
  showSource: boolean
  onToggleSource: () => void
  sourceLocked?: boolean
}

function Toolbar({
  editor,
  showSource,
  onToggleSource,
  sourceLocked,
}: ToolbarProps) {
  const { t } = useTranslation()

  const handleSetLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt(
      t('email.templates.editor.linkUrl', 'Link URL'),
      previous ?? 'https://',
    )
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run()
  }

  const handleSetImage = () => {
    const url = window.prompt(
      t('email.templates.editor.imageUrl', 'Image URL'),
      'https://',
    )
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-1 py-1 bg-muted/30">
      <ToolbarToggle
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label={t('email.templates.editor.bold', 'Bold')}
        disabled={showSource}
      >
        <Bold className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label={t('email.templates.editor.italic', 'Italic')}
        disabled={showSource}
      >
        <Italic className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label={t('email.templates.editor.strike', 'Strikethrough')}
        disabled={showSource}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarToggle>

      <Separator />

      <ToolbarToggle
        active={editor.isActive('heading', { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        label="H1"
        disabled={showSource}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={editor.isActive('heading', { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        label="H2"
        disabled={showSource}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={editor.isActive('heading', { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        label="H3"
        disabled={showSource}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarToggle>

      <Separator />

      <ToolbarToggle
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label={t('email.templates.editor.bulletList', 'Bulleted list')}
        disabled={showSource}
      >
        <List className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label={t('email.templates.editor.orderedList', 'Numbered list')}
        disabled={showSource}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarToggle>

      <Separator />

      <ToolbarToggle
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        label={t('email.templates.editor.alignLeft', 'Align left')}
        disabled={showSource}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        label={t('email.templates.editor.alignCenter', 'Align center')}
        disabled={showSource}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        label={t('email.templates.editor.alignRight', 'Align right')}
        disabled={showSource}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarToggle>

      <Separator />

      <ToolbarToggle
        active={editor.isActive('link')}
        onClick={handleSetLink}
        label={t('email.templates.editor.link', 'Link')}
        disabled={showSource}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        active={false}
        onClick={handleSetImage}
        label={t('email.templates.editor.image', 'Image')}
        disabled={showSource}
      >
        <ImageIcon className="h-4 w-4" />
      </ToolbarToggle>

      <Separator />

      <InsertVariablePopover editor={editor} disabled={showSource} />

      <div className="ml-auto" />

      <Button
        type="button"
        size="sm"
        variant={showSource ? 'default' : 'ghost'}
        onClick={onToggleSource}
        disabled={sourceLocked}
        title={
          sourceLocked
            ? t(
                'email.templates.editor.sourceLockedTooltip',
                'Locked to preserve embedded styles.',
              )
            : undefined
        }
        className="h-7 gap-1.5 text-xs"
      >
        <Code className="h-3.5 w-3.5" />
        {showSource
          ? t('email.templates.editor.hideSource', 'Hide source')
          : t('email.templates.editor.viewSource', 'View source')}
      </Button>
    </div>
  )
}

function ToolbarToggle({
  active,
  onClick,
  label,
  children,
  disabled,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        'h-7 w-7 p-0',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </Button>
  )
}

function Separator() {
  return <div className="h-5 w-px bg-border mx-1" />
}

interface InsertVariablePopoverProps {
  editor: Editor
  disabled?: boolean
}

function InsertVariablePopover({
  editor,
  disabled,
}: InsertVariablePopoverProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const insert = (key: string) => {
    editor.chain().focus().insertContent(key).run()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs"
          disabled={disabled}
          title={t(
            'email.templates.editor.insertVariable',
            'Insert variable',
          )}
        >
          <Variable className="h-3.5 w-3.5" />
          {t('email.templates.editor.variable', 'Variable')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div className="text-xs text-muted-foreground px-2 pt-1.5 pb-1">
          {t(
            'email.templates.editor.variableHint',
            'Inserted as merge tag, replaced per recipient.',
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          {EMAIL_TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insert(v.key)}
              className="flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors text-left"
            >
              <span className="font-mono text-xs text-primary">{v.key}</span>
              <span className="text-xs text-muted-foreground">{v.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
