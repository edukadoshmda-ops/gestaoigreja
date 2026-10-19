import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export type PlanType = 'starter' | 'growth' | 'professional' | 'enterprise' | 'trial';

export interface PlanInfo {
  plan: PlanType;
  label: string;
  maxMembers: number;
  price: number;
  currentMembers: number;
  isLimitReached: boolean;
  percentUsed: number;
  status: 'ativa' | 'inadimplente' | 'cancelada' | 'trial' | null;
  loading: boolean;
}

const PLAN_CONFIG: Record<PlanType, { label: string; maxMembers: number; price: number }> = {
  starter:      { label: 'Starter',       maxMembers: 100,   price: 199 },
  growth:       { label: 'Growth',        maxMembers: 500,   price: 299 },
  professional: { label: 'Professional',  maxMembers: 2000,  price: 499 },
  enterprise:   { label: 'Enterprise',    maxMembers: 99999, price: 1200 },
  trial:        { label: 'Trial',         maxMembers: 30,    price: 0 },
};

/** Detecta qual plano corresponde ao valor de plan_amount */
function detectPlanByAmount(amount: number | null, status: string): PlanType {
  if (status === 'trial') return 'trial';
  if (!amount) return 'starter';
  if (amount <= 199) return 'starter';
  if (amount <= 299) return 'growth';
  if (amount <= 499) return 'professional';
  return 'enterprise';
}

const planCache = new Map<string, { data: PlanInfo; timestamp: number }>();
const PLAN_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos

export function useSubscriptionPlan(): PlanInfo {
  const { churchId } = useAuth();
  const [info, setInfo] = useState<PlanInfo>(() => {
    if (churchId) {
      const cached = planCache.get(churchId);
      if (cached && Date.now() - cached.timestamp < PLAN_CACHE_TTL_MS) {
        return cached.data;
      }
    }
    return {
      plan: 'starter',
      label: 'Starter',
      maxMembers: 100,
      price: 199,
      currentMembers: 0,
      isLimitReached: false,
      percentUsed: 0,
      status: null,
      loading: true,
    };
  });

  useEffect(() => {
    if (!churchId) {
      setInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    const cached = planCache.get(churchId);
    if (cached && Date.now() - cached.timestamp < PLAN_CACHE_TTL_MS) {
      setInfo(cached.data);
      return;
    }

    const load = async () => {
      try {
        // Busca assinatura
        const { data: sub } = await supabase
          .from('church_subscriptions')
          .select('status, plan_amount, subscription_plan')
          .eq('church_id', churchId)
          .maybeSingle();

        // Conta membros ativos
        const { count: memberCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .eq('status', 'ativo');

        const status = (sub?.status ?? 'trial') as PlanInfo['status'];
        
        // Prioridade: campo subscription_plan > detectar por amount
        let plan: PlanType;
        if (sub?.subscription_plan && PLAN_CONFIG[sub.subscription_plan as PlanType]) {
          plan = sub.subscription_plan as PlanType;
        } else {
          plan = detectPlanByAmount(sub?.plan_amount ?? null, status ?? 'trial');
        }

        const config = PLAN_CONFIG[plan];
        const current = memberCount ?? 0;
        const percentUsed = Math.min(100, Math.round((current / config.maxMembers) * 100));

        const nextInfo: PlanInfo = {
          plan,
          label: config.label,
          maxMembers: config.maxMembers,
          price: config.price,
          currentMembers: current,
          isLimitReached: current >= config.maxMembers,
          percentUsed,
          status,
          loading: false,
        };
        planCache.set(churchId, { data: nextInfo, timestamp: Date.now() });
        setInfo(nextInfo);
      } catch {
        setInfo(prev => ({ ...prev, loading: false }));
      }
    };

    load();
  }, [churchId]);

  return info;
}
