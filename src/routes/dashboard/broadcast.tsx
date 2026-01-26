import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, Send, Info } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FormProvider } from 'react-hook-form'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { useMe } from '@/hooks/api/useAuth'
import { useBroadcastNotification } from '@/hooks/api/useNotifications'
import { useClients } from '@/hooks/api/useClients'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// Schema for the broadcast form
const broadcastSchema = z.object({
  audience: z.enum(['all', 'specific']),
  roles: z.array(z.string()).min(1, 'Select at least one role'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message too long'),
  isUrgent: z.boolean().optional(),
  targetClientId: z.string().optional(),
})

type BroadcastFormValues = z.infer<typeof broadcastSchema>

export const Route = createFileRoute('/dashboard/broadcast')({
  beforeLoad: async () => {
    // We can check role here or in the component, but component is safer for hooks
  },
  component: BroadcastPage,
})

function BroadcastPage() {
  const { data: user } = useMe()

  // Protect the route - only for superadmin
  if (user && user.role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    )
  }

  const methods = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      audience: 'all',
      roles: ['superadmin', 'admin', 'supervisor', 'agent'], // Default all selected based on UI "Select All" implication? Or initially empty?
      // Looking at the UI, "Select All" is an action, but buttons look togglable. Let's default to none or all.
      // The UI shows buttons unselected (outlined) or selected (filled).
      // Let's assume we maintain a local state for these toggles sync'd with form.
      message: '',
      targetClientId: undefined,
    },
  })

  // We explicitly manage role selection state to match the UI's toggle button feel
  // and sync it with the form.
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const roles = [
    { id: 'superadmin', label: 'Superadmin' },
    { id: 'admin', label: 'Admin' },
    { id: 'supervisor', label: 'Supervisor' },
    { id: 'agent', label: 'Agent' },
  ]

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) => {
      const newRoles = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
      methods.setValue('roles', newRoles, { shouldValidate: true })
      return newRoles
    })
  }

  const selectAllRoles = () => {
    const allRoleIds = roles.map((r) => r.id)
    setSelectedRoles(allRoleIds)
    methods.setValue('roles', allRoleIds, { shouldValidate: true })
  }

  const [audience, setAudience] = useState<'all' | 'specific'>('all')

  const { data: clientsData, isLoading: isLoadingClients } = useClients({
    limit: 100,
    status: 'active' as any, // casting to fix enum type mismatch if needed, or better import ClientStatus
  })

  const { mutate: broadcast, isPending } = useBroadcastNotification()

  const onSubmit = (data: BroadcastFormValues) => {
    // Validation: if specific audience, require client selection
    if (audience === 'specific' && !data.targetClientId) {
      methods.setError('targetClientId', {
        type: 'manual',
        message: 'Please select a client',
      })
      return
    }

    // Validation: if all audience, map to null targetClientId
    const payload = {
      title: 'Broadcast Notification', // Title is fixed for now or could be added to form
      message: data.message,
      type: 'info' as const, // could be made dynamic
      category: 'BROADCAST',
      targetClientId: audience === 'specific' ? data.targetClientId : null,
      targetRole: null, // Logic for role filtering combined with client selection needs clarification.
      // API says targetRole is optional string. We have an array of roles in form.
      // The API structure suggests sending ONE broadcast per role or sending null for all roles.
      // Or maybe it supports broadcasting to specific roles within a client.
      // Since form allows multiple roles, we might need to iterate or API handles arrays.
      // The provided API doc: "targetRole": "agent" (singular string).
      // But the UI allows checking multiple.
      // Let's assume we send null if all are checked, or we restrict to single choice,
      // OR we loop through selected roles and send multiple requests?
      // "Filter by Role" implies we send to these roles.
      // Let's iterate if multiple roles selected.
    }

    // For now, let's implement sending one request per selected role if distinct?
    // Actually the API says `targetRole: "agent"`.
    // If I select Admin + Agent, I can't send "Admin,Agent".
    // I will iterate over selected roles and send multiple requests if necessary, OR send null if ALL are picked.
    // Let's check if "all" roles are selected.
    const allRoleIds = roles.map((r) => r.id)
    const isAllRoles =
      selectedRoles.length === allRoleIds.length &&
      selectedRoles.every((r) => allRoleIds.includes(r))

    if (isAllRoles) {
      // Send once with targetRole = null (All Roles)
      broadcast(
        { ...payload, targetRole: null, type: 'info' },
        {
          onSuccess: () => {
            toast.success('Broadcast sent successfully')
            methods.reset()
            setAudience('all')
            setSelectedRoles(allRoleIds)
          },
          onError: (error) => {
            toast.error(`Failed to send broadcast: ${error.message}`)
          },
        },
      )
    } else {
      // Send for each selected role
      // This is a bit naive but fits the API limitation of singular role.
      // Better would be if API accepted array.
      // We will loop.
      Promise.all(
        selectedRoles.map(
          (role) =>
            new Promise<void>((resolve, reject) => {
              broadcast(
                { ...payload, targetRole: role, type: 'info' },
                {
                  onSuccess: () => resolve(),
                  onError: (e) => reject(e),
                },
              )
            }),
        ),
      )
        .then(() => {
          toast.success('Broadcast sent to selected roles')
          methods.reset()
          setAudience('all')
          setSelectedRoles(allRoleIds)
        })
        .catch(() => {
          toast.error(`Failed to send some broadcasts`)
        })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-megaphone"
              >
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Broadcast Center</h1>
          </div>
          <p className="text-muted-foreground">
            Send push notifications and alerts to clients and staff members.
            Messages will be delivered to the web dashboard and mobile
            application in real-time.
          </p>
        </CardContent>
      </Card>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="bg-card border border-border rounded-xl p-6 space-y-8">
            {/* Target Audience */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">
                Target Audience
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      audience === 'all'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-muted-foreground/25'
                    }
                  `}
                  onClick={() => {
                    setAudience('all')
                    methods.setValue('audience', 'all')
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-foreground mb-1">
                        All Clients
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Broadcast to entire database
                      </div>
                    </div>
                    {audience === 'all' && (
                      <CheckCircle2 className="text-primary h-5 w-5" />
                    )}
                  </div>
                </div>

                <div
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      audience === 'specific'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-muted-foreground/25'
                    }
                  `}
                  onClick={() => {
                    setAudience('specific')
                    methods.setValue('audience', 'specific')
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-foreground mb-1">
                        Specific Clients
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Select individual accounts
                      </div>
                    </div>
                    {audience === 'specific' && (
                      <CheckCircle2 className="text-primary h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Client Selection Dropdown */}
              {audience === 'specific' && (
                <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select Client
                  </label>
                  <div className="max-w-md">
                    <Select
                      onValueChange={(value) =>
                        methods.setValue('targetClientId', value)
                      }
                      defaultValue={methods.getValues('targetClientId')}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue
                          placeholder={
                            isLoadingClients
                              ? 'Loading clients...'
                              : 'Select a client'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {clientsData?.data.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {methods.formState.errors.targetClientId && (
                      <p className="text-destructive text-xs mt-1">
                        {methods.formState.errors.targetClientId.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Filter by Role */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-foreground">
                  Filter by Role
                </h3>
                <button
                  type="button"
                  onClick={selectAllRoles}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Select All
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {roles.map((role) => {
                  const isSelected = selectedRoles.includes(role.id)
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={`
                        px-6 py-2 rounded-full text-sm font-medium transition-all border
                        ${
                          isSelected
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-muted text-muted-foreground border-transparent hover:text-foreground'
                        }
                      `}
                    >
                      {role.label}
                    </button>
                  )
                })}
              </div>
              {methods.formState.errors.roles && (
                <p className="text-destructive text-xs">
                  {methods.formState.errors.roles.message}
                </p>
              )}
            </div>

            {/* Notification Message */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">
                Notification Message
              </h3>
              <div className="relative">
                <Textarea
                  {...methods.register('message')}
                  className="min-h-[150px] resize-none focus-visible:ring-1"
                  placeholder="Type your notification message here... e.g., 'Maintenance scheduled for tonight at 2 AM EST'"
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {methods.watch('message')?.length || 0} / 500 characters
                </div>
              </div>
              {methods.formState.errors.message && (
                <p className="text-destructive text-xs">
                  {methods.formState.errors.message.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-6 border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              className="text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-[150px]"
              disabled={isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {isPending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
