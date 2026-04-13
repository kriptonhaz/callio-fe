import { createFileRoute } from '@tanstack/react-router'
import { RoleGuard } from '@/lib/auth-guard'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { LeadStatusTab } from '@/components/master-data/LeadStatusTab'

export const Route = createFileRoute('/dashboard/settings/master-data/')({
  component: MasterDataPage,
})

function MasterDataPage() {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <div className="p-4 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Master Data</h1>
          <p className="text-sm text-muted-foreground">
            Configure reusable lookup values for your client.
          </p>
        </div>

        <Tabs defaultValue="lead-status">
          <TabsList>
            <TabsTrigger value="lead-status">Lead Status</TabsTrigger>
          </TabsList>
          <TabsContent value="lead-status" className="mt-4">
            <LeadStatusTab />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
