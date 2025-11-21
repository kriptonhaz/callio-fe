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

const recentActivity = [
  {
    id: "CALL-1024",
    agent: "John Doe",
    status: "Completed",
    duration: "5m 23s",
    timestamp: "2 mins ago",
  },
  {
    id: "CALL-1025",
    agent: "Jane Smith",
    status: "In Progress",
    duration: "12m 10s",
    timestamp: "Now",
  },
  {
    id: "CALL-1026",
    agent: "Mike Johnson",
    status: "Missed",
    duration: "0s",
    timestamp: "5 mins ago",
  },
  {
    id: "CALL-1027",
    agent: "Sarah Wilson",
    status: "Completed",
    duration: "3m 45s",
    timestamp: "10 mins ago",
  },
  {
    id: "CALL-1028",
    agent: "Tom Brown",
    status: "Completed",
    duration: "8m 12s",
    timestamp: "15 mins ago",
  },
];

export function RecentActivityTable() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Time</TableHead>
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
                    {activity.status}
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
