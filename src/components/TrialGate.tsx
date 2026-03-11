import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trialService } from '@/services/trial.service';

/**
 * Gate para igrejas em trial:
 * - Se trial expirado: salva lead e redireciona para Hotmart
 * - Se trial ativo mas institucional não preenchida: redireciona para /institucional
 */
export function TrialGate({ children }: { children: React.ReactNode }) {
  const { user, churchId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'superadmin' || !churchId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    trialService.getTrialInfo(churchId).then((info) => {
      if (cancelled) return;
      setChecking(false);
      setLoading(false);

      if (!info.isTrial) return;

      if (info.isExpired) {
        setLoading(true);
        trialService.saveLeadAndExpire(churchId).catch(() => {}).finally(() => {
          window.location.href = trialService.getSalesUrl();
        });
        return;
      }

      if (!info.institutionalCompleted && location.pathname !== '/institucional') {
        navigate('/institucional', { replace: true });
      }
    }).catch(() => {
      if (!cancelled) {
        setChecking(false);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user?.id, churchId, location.pathname, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
