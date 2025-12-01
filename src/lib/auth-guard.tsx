import { ReactNode, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUser } from '@/hooks/api/useUsers';
import { getAccessToken } from '@/lib/api/client';
import { decodeJwt } from '@/lib/jwt';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const navigate = useNavigate();
  const token = getAccessToken();
  const decodedToken = token ? decodeJwt(token) : null;
  const userId = decodedToken?.sub;
  const jwtRole = decodedToken?.role;

  const { data: user, isLoading } = useUser(userId || '', { refetchInterval: 60000 });
  const role = user?.role || jwtRole;

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      navigate({ to: '/dashboard' });
    }
  }, [role, isLoading, allowedRoles, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role && !allowedRoles.includes(role)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
