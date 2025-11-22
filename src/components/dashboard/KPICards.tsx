import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from '@/components/animate-ui/icons/phone';
import { Users } from '@/components/animate-ui/icons/users';
import { Clock } from '@/components/animate-ui/icons/clock';
import { Activity } from '@/components/animate-ui/icons/activity';
import { ArrowUpRight } from '@/components/animate-ui/icons/arrow-up-right';
import { ArrowDownRight } from '@/components/animate-ui/icons/arrow-down-right';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { useTranslation } from 'react-i18next';

export function KPICards() {
  const { t } = useTranslation();

  const kpiData = [
    {
      title: t('dashboard.kpi.totalCalls'),
      value: "1,284",
      change: "+12.5%",
      trend: "up",
      icon: Phone,
      color: "text-blue-500",
    },
    {
      title: t('dashboard.kpi.activeAgents'),
      value: "42",
      change: "+4",
      trend: "up",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: t('dashboard.kpi.queueVolume'),
      value: "18",
      change: "-5.2%",
      trend: "down",
      icon: Activity,
      color: "text-orange-500",
    },
    {
      title: t('dashboard.kpi.avgHandleTime'),
      value: "4m 12s",
      change: "-1.1%",
      trend: "down",
      icon: Clock,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => (
        <AnimateIcon key={index} animateOnHover asChild>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {kpi.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" animateOnHover />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" animateOnHover />
                )}
                <span className={kpi.trend === 'up' ? "text-green-500" : "text-red-500"}>
                  {kpi.change}
                </span>
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
        </AnimateIcon>
      ))}
    </div>
  );
}
