import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function RecentActivityTable() {
  const { t } = useTranslation();

  const recentActivity = [
    {
      id: "CALL-1024",
      agent: "John Doe",
      status: "Completed",
      duration: "5m 23s",
      timestamp: t('dashboard.table.timestamps.minsAgo', { count: 2 }),
    },
    {
      id: "CALL-1025",
      agent: "Jane Smith",
      status: "In Progress",
      duration: "12m 10s",
      timestamp: t('dashboard.table.timestamps.now'),
    },
    {
      id: "CALL-1026",
      agent: "Mike Johnson",
      status: "Missed",
      duration: "0s",
      timestamp: t('dashboard.table.timestamps.minsAgo', { count: 5 }),
    },
    {
      id: "CALL-1027",
      agent: "Sarah Wilson",
      status: "Completed",
      duration: "3m 45s",
      timestamp: t('dashboard.table.timestamps.minsAgo', { count: 10 }),
    },
    {
      id: "CALL-1028",
      agent: "Tom Brown",
      status: "Completed",
      duration: "8m 12s",
      timestamp: t('dashboard.table.timestamps.minsAgo', { count: 15 }),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dashboard.table.id')}</TableHead>
              <TableHead>{t('dashboard.table.agent')}</TableHead>
              <TableHead>{t('dashboard.table.status')}</TableHead>
              <TableHead>{t('dashboard.table.duration')}</TableHead>
              <TableHead className="text-right">{t('dashboard.table.time')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.id}</TableCell>
                <TableCell>{activity.agent}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      activity.status === 'Completed' ? 'default' : 
                      activity.status === 'In Progress' ? 'secondary' : 'destructive'
                    }
                    className={
                      activity.status === 'Completed' ? 'bg-green-500 hover:bg-green-600' :
                      activity.status === 'In Progress' ? 'bg-blue-500 hover:bg-blue-600' : ''
                    }
                  >
                    {activity.status === 'Completed' ? t('dashboard.table.statuses.completed') :
                     activity.status === 'In Progress' ? t('dashboard.table.statuses.inProgress') :
                     t('dashboard.table.statuses.missed')}
                  </Badge>
                </TableCell>
                <TableCell>{activity.duration}</TableCell>
                <TableCell className="text-right text-muted-foreground">{activity.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
