import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Church, CheckCircle2, UserPlus, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { MemberForm, MemberFormData } from '@/components/MemberForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { churchesService } from '@/services/churches.service';
import { membersService } from '@/services/members.service';
import { packExtendedFieldsToNotes } from '@/lib/memberUtils';
import { supabase } from '@/lib/supabaseClient';

interface PublicChurchInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  president_name?: string | null;
  address?: string | null;
}

export default function PublicMemberRegistration() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const churchIdentifier = slug || searchParams.get('igreja') || searchParams.get('church') || '';

  const [church, setChurch] = useState<PublicChurchInfo | null>(null);
  const [loadingChurch, setLoadingChurch] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMemberName, setSubmittedMemberName] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const { toast } = useToast();

  useDocumentTitle(church?.name ? `Ficha de Membro — ${church.name}` : 'Cadastro de Membro');

  useEffect(() => {
    let active = true;
    async function loadChurch() {
      if (!churchIdentifier) {
        setLoadingChurch(false);
        return;
      }
      setLoadingChurch(true);
      try {
        // 1. Tenta via churchesService (leitura direta ou cache)
        const found = await churchesService.getBySlug(churchIdentifier).catch(() => null);
        if (found && active) {
          setChurch(found as PublicChurchInfo);
          setLoadingChurch(false);
          return;
        }

        // 2. Fallback via Edge Function pública
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
          const res = await fetch(
            `${supabaseUrl}/functions/v1/public-member-registration?church=${encodeURIComponent(churchIdentifier)}`
          );
          if (res.ok) {
            const json = await res.json();
            if (json?.church && active) {
              setChurch(json.church);
              setLoadingChurch(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao buscar dados da igreja para ficha pública:', e);
      } finally {
        if (active) setLoadingChurch(false);
      }
    }
    loadChurch();
    return () => {
      active = false;
    };
  }, [churchIdentifier]);

  const handleRegistrationSubmit = async (data: MemberFormData) => {
    if (!church?.id && !churchIdentifier) {
      toast({
        title: 'Link inválido',
        description: 'Não foi possível identificar a igreja deste formulário.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const packedNotes = packExtendedFieldsToNotes('', data);
      const memberPayload = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        birth_date: data.birthDate || null,
        marital_status: data.maritalStatus as any,
        address: data.address || null,
        photo_url: data.photoUrl || null,
        notes: packedNotes,
        status: data.category === 'congregado' ? 'visitante' : 'ativo',
      };

      let savedOk = false;

      // 1. Tenta salvar via Edge Function pública (funciona para membros sem login usando Service Role)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/public-member-registration`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
            },
            body: JSON.stringify({
              churchId: church?.id || churchIdentifier,
              churchSlug: church?.slug || churchIdentifier,
              member: memberPayload,
            }),
          });
          const result = await res.json().catch(() => null);
          if (res.ok && result?.ok) {
            savedOk = true;
          }
        } catch (err) {
          console.warn('Fallback para membersService.create após falha na Edge Function:', err);
        }
      }

      // 2. Fallback direto via membersService
      if (!savedOk) {
        await membersService.create(memberPayload as any, church?.id || churchIdentifier);
      }

      setSubmittedMemberName(data.name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast({
        title: 'Cadastro enviado com sucesso!',
        description: `Obrigado, ${data.name}! Seus dados foram registrados na igreja.`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar ficha de membro:', error);
      toast({
        title: 'Erro ao enviar cadastro',
        description: error?.message || 'Não foi possível registrar seus dados agora. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingChurch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Carregando formulário da igreja...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho com Identidade Visual da Igreja */}
        <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {church?.logo_url ? (
            <img
              src={church.logo_url}
              alt={church.name}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/20 shadow-sm shrink-0 bg-muted"
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
              <Church className="h-10 w-10 text-primary" />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Ficha Oficial de Membros e Congregados
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {church?.name || 'Cadastro de Membro'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Preencha seus dados abaixo com atenção para atualizar seu cadastro e sua carteirinha na igreja.
              {church?.president_name ? ` • Pastor Presidente: ${church.president_name}` : ''}
            </p>
          </div>
        </div>

        {!church && !churchIdentifier && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Link incompleto</AlertTitle>
            <AlertDescription>
              Este link não contém o código da igreja. Solicite o link atualizado à secretaria da sua igreja.
            </AlertDescription>
          </Alert>
        )}

        {submittedMemberName ? (
          <Card className="border-emerald-500/30 shadow-xl overflow-hidden">
            <CardContent className="p-8 sm:p-12 text-center space-y-6">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-12 w-12" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Cadastro Recebido com Sucesso! 🎉
                </h2>
                <p className="text-muted-foreground text-base">
                  Olá, <strong>{submittedMemberName}</strong>! Sua ficha cadastral foi enviada para{' '}
                  <strong>{church?.name || 'sua igreja'}</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Button
                  size="lg"
                  onClick={() => {
                    setSubmittedMemberName(null);
                    setFormKey((k) => k + 1);
                  }}
                  className="w-full sm:w-auto gap-2 font-semibold"
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar outro membro da família
                </Button>

                {church?.slug && (
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                    <Link to={`/igreja/${church.slug}`}>
                      Acessar aplicativo da igreja
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <MemberForm
            key={formKey}
            onSubmit={handleRegistrationSubmit}
            churchName={church?.name || ''}
            pastorName={church?.president_name || ''}
            isSubmitting={submitting}
            disabled={!church && !churchIdentifier}
            isPublicForm
          />
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Seus dados estão protegidos e são de uso exclusivo da secretaria da {church?.name || 'igreja'}.
        </p>
      </div>
    </div>
  );
}
