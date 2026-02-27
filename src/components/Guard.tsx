import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
  roles?: string[];
  to?: string;
}

export default function Guard({ children, roles, to = '/login' }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <Navigate to={to} replace />;
  if (roles && !roles.some(r => user.roles.includes(r))) return <Navigate to="/" replace />;

  return <>{children}</>;
}
