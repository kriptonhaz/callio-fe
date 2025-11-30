import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';

interface SubscriptionCardProps {
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
}

export function SubscriptionCard({ subscriptionPlan, subscriptionExpiry }: SubscriptionCardProps) {
  const { t } = useTranslation();

  const calculateDaysRemaining = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = subscriptionExpiry ? calculateDaysRemaining(subscriptionExpiry) : null;
  const isExpired = daysRemaining !== null && daysRemaining < 0;
  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clients.subscription.title', 'Subscription Information')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              {t('clients.subscription.plan', 'Plan')}
            </span>
            {subscriptionPlan ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 w-fit">
                {subscriptionPlan}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {t('common.notProvided', 'Not provided')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              {t('clients.subscription.expiry', 'Expiry Date')}
            </span>
            {subscriptionExpiry ? (
              <div className="flex items-center gap-2">
                <span>{new Date(subscriptionExpiry).toLocaleDateString()}</span>
                {isExpired && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {t('clients.subscription.expired', 'Expired')}
                  </span>
                )}
                {isExpiringSoon && (
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {daysRemaining} {t('clients.subscription.daysRemaining', 'days remaining')}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                {t('common.notProvided', 'Not provided')}
              </span>
            )}
          </div>
        </div>

        {!isExpired && daysRemaining !== null && daysRemaining > 30 && (
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400 w-fit">
                {t('clients.subscription.active', 'Active')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
