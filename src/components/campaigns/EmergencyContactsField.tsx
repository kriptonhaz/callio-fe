import { useTranslation } from 'react-i18next'
import {
  
  
  
  useFieldArray
} from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import type {Control, FieldValues, Path} from 'react-hook-form';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  MAX_EMERGENCY_CONTACTS,
  OTHER_RELATION,
  RELATION_SLUGS,
} from '@/lib/leads/relations'

export interface EmergencyContactFormRow {
  name: string
  phone: string
  relation: string
  relationOther?: string
}

export const emptyEmergencyContactRow: EmergencyContactFormRow = {
  name: '',
  phone: '',
  relation: '',
  relationOther: '',
}

interface Props<T extends FieldValues> {
  control: Control<T>
  // Must point to a field of type Array<EmergencyContactFormRow>.
  name: Path<T>
}

// Renders the "Emergency Contacts" form section with up to MAX rows. Each row
// has Name, Phone, a Relation dropdown, and a conditional free-text input that
// appears when the user picks "Other".
export function EmergencyContactsField<T extends FieldValues>({
  control,
  name,
}: Props<T>) {
  const { t } = useTranslation()
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as never,
  })

  const atMax = fields.length >= MAX_EMERGENCY_CONTACTS

  const handleAdd = () => {
    if (atMax) return
    append(emptyEmergencyContactRow as never)
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <FormLabel className="text-sm font-medium">
          {t('leads.emergencyContacts', 'Emergency Contacts')}{' '}
          <span className="text-xs text-muted-foreground font-normal">
            ({fields.length}/{MAX_EMERGENCY_CONTACTS})
          </span>
        </FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={atMax}
          className="h-8 gap-1"
        >
          <Plus className="h-3 w-3" />
          {t('leads.addEmergencyContact', 'Add Contact')}
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t(
            'leads.noEmergencyContacts',
            'No emergency contacts added yet.',
          )}
        </p>
      )}

      {atMax && (
        <p className="text-xs text-muted-foreground">
          {t('leads.maxEmergencyContacts', 'Maximum 5 contacts.')}
        </p>
      )}

      {fields.map((field, index) => (
        <EmergencyContactRow
          key={field.id}
          control={control}
          baseName={`${name}.${index}` as Path<T>}
          onRemove={() => remove(index)}
        />
      ))}
    </div>
  )
}

interface RowProps<T extends FieldValues> {
  control: Control<T>
  baseName: Path<T>
  onRemove: () => void
}

function EmergencyContactRow<T extends FieldValues>({
  control,
  baseName,
  onRemove,
}: RowProps<T>) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-start justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          aria-label={t('common.delete', 'Delete')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <FormField
        control={control}
        name={`${baseName}.name` as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">
              {t('leads.name', 'Name')}{' '}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t('leads.emergencyNamePlaceholder', 'Mom')}
                className="h-10"
                {...field}
                value={(field.value as string | undefined) ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${baseName}.phone` as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">
              {t('leads.phone', 'Phone')}{' '}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="+62812345678"
                className="h-10"
                {...field}
                value={(field.value as string | undefined) ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${baseName}.relation` as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">
              {t('leads.emergencyRelation', 'Relation')}{' '}
              <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={(field.value as string | undefined) ?? ''}
            >
              <FormControl>
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={t(
                      'leads.selectRelation',
                      'Select relation',
                    )}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {RELATION_SLUGS.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    {t(`leads.relations.${slug}`, slug)}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_RELATION}>
                  {t('leads.relations.other', 'Other')}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${baseName}.relation` as Path<T>}
        render={({ field: relationField }) => {
          const isOther = relationField.value === OTHER_RELATION
          if (!isOther) return <></>
          return (
            <FormField
              control={control}
              name={`${baseName}.relationOther` as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    {t(
                      'leads.specifyRelation',
                      'Specify relationship',
                    )}{' '}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'leads.specifyRelationPlaceholder',
                        'e.g. step-uncle',
                      )}
                      className="h-10"
                      {...field}
                      value={(field.value as string | undefined) ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        }}
      />
    </div>
  )
}
