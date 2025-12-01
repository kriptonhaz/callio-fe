import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useVerifyUser } from '@/hooks/api/useUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const verifySearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/verify')({
  validateSearch: verifySearchSchema,
  component: VerifyPage,
});

function VerifyPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: verifyUser, isPending, isSuccess, isError, error } = useVerifyUser();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (token) {
      verifyUser(token);
    }
  }, [token, verifyUser]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      navigate({ to: '/login' });
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  const handleGoToLogin = () => {
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-navy-900 dark:text-white">
            {t('auth.verify.title', 'Account Verification')}
          </CardTitle>
          <CardDescription>
            {t('auth.verify.description', 'Verifying your email address...')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
          {!token ? (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {t('auth.verify.invalidLink', 'Invalid verification link.')}
              </p>
              <p className="text-sm text-gray-500">
                {t('auth.verify.missingToken', 'The verification token is missing.')}
              </p>
              <Button onClick={handleGoToLogin} className="w-full">
                {t('auth.login.title', 'Go to Login')}
              </Button>
            </div>
          ) : isPending ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {t('auth.verify.verifying', 'Please wait while we verify your account...')}
              </p>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {t('auth.verify.success', 'Verification Successful!')}
              </p>
              <p className="text-sm text-gray-500">
                {t('auth.verify.redirecting', 'Redirecting to login in {{count}} seconds...', { count: countdown })}
              </p>
              <Button onClick={handleGoToLogin} className="w-full">
                {t('auth.login.title', 'Go to Login Now')}
              </Button>
            </div>
          ) : isError ? (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {t('auth.verify.failed', 'Verification Failed')}
              </p>
              <p className="text-sm text-red-500">
                {error?.message || t('auth.verify.genericError', 'An error occurred during verification.')}
              </p>
              <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                {t('auth.login.title', 'Back to Login')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
