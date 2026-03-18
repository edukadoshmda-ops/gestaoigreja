import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, CreditCard, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { churchesService } from '@/services/churches.service';
import { pagamentosService } from '@/services/pagamentos.service';
import { criarContaStone } from '@/lib/pagarme';

type ModeChoice = 'direct' | 'marketplace' | null;

export default function AtivarPagamentos() {
  useDocumentTitle('Ativar pagamentos');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { churchId, viewingChurch, user } = useAuth();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;

  const canEdit = ['admin', 'pastor', 'secretario', 'superadmin', 'tesoureiro'].includes(user?.role || '');

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [church, setChurch] = useState<any>(null);

  const [mode, setMode] = useState<ModeChoice>(null);
  const [stoneApiKey, setStoneApiKey] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const [testAmount, setTestAmount] = useState<string>('10');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (effectiveChurchId) loadChurch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveChurchId]);

  async function loadChurch() {
    if (!effectiveChurchId) return;
    setLoading(true);
    try {
      const c = await churchesService.getById(effectiveChurchId);
      setChurch(c as any);
      setStoneApiKey(String((c as any)?.stone_api_key || ''));
      const currentMode = String((c as any)?.stone_mode || '').toLowerCase();
      if (currentMode === 'direct' || currentMode === 'marketplace') setMode(currentMode);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar igreja', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const steps = useMemo(() => ([
    { n: 1, title: 'Cadastro da igreja' },
    { n: 2, title: 'Escolher modo' },
    { n: 3, title: 'Configuração' },
    { n: 4, title: 'Teste' },
    { n: 5, title: 'Ativo' },
  ]), []);

  const isActive = useMemo(() => {
    const m = String(church?.stone_mode || '').toLowerCase();
    if (m === 'direct') return Boolean((church?.stone_api_key || '').trim());
    if (m === 'marketplace') return Boolean(church?.stone_recipient_id);
    return false;
  }, [church]);

  function StepDot({ done }: { done: boolean }) {
    return done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-muted-foreground/50" />;
  }

  async function handleSaveMode(nextMode: Exclude<ModeChoice, null>) {
    if (!effectiveChurchId || !canEdit) return;
    setBusy(true);
    try {
      await churchesService.update(effectiveChurchId, {
        stone_mode: nextMode,
        // segurança: se mudou para marketplace, não deixa chave no banco
        stone_api_key: nextMode === 'marketplace' ? null : undefined,
      } as any);
      await loadChurch();
      toast({ title: 'Modo selecionado', description: nextMode === 'direct' ? 'MEI (Direct)' : 'Marketplace' });
      setStep(3);
    } catch (e: any) {
      toast({ title: 'Erro ao salvar modo', description: e?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function handleConnectDirect() {
    if (!effectiveChurchId || !canEdit) return;
    const key = String(stoneApiKey || '').trim();
    if (!key) {
      toast({ title: 'Informe a API Key', description: 'Cole a API Key da Stone/Pagar.me.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await churchesService.update(effectiveChurchId, {
        stone_mode: 'direct',
        stone_api_key: key,
      } as any);
      await loadChurch();
      toast({ title: 'Conta conectada!', description: 'Modo Direct (MEI) ativado.' });
      setStep(4);
    } catch (e: any) {
      toast({ title: 'Erro ao conectar', description: e?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function handleActivateMarketplace() {
    if (!effectiveChurchId || !canEdit) return;
    setBusy(true);
    try {
      // 1) marca marketplace e remove chave local
      await churchesService.update(effectiveChurchId, {
        stone_mode: 'marketplace',
        stone_api_key: null,
      } as any);

      // 2) cria recipient se necessário
      const nome = String(church?.name || '').trim();
      const cnpj = String(church?.cnpj || '').trim();
      if (!church?.stone_recipient_id) {
        if (!nome || !cnpj) {
          toast({
            title: 'Dados incompletos',
            description: 'Para criar a conta, a igreja precisa ter Nome e CNPJ cadastrados.',
            variant: 'destructive',
          });
        } else {
          await criarContaStone({ church_id: effectiveChurchId, nome, cnpj });
        }
      }
      await loadChurch();
      toast({ title: 'Pagamentos ativados!', description: 'Marketplace configurado com sucesso.' });
      setStep(4);
    } catch (e: any) {
      toast({ title: 'Erro ao ativar', description: e?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    if (!effectiveChurchId) return;
    setBusy(true);
    setCheckoutUrl(null);
    setQrCodeUrl(null);
    try {
      const valor = Number(String(testAmount).replace(',', '.'));
      if (!Number.isFinite(valor) || valor <= 0) {
        toast({ title: 'Valor inválido', description: 'Informe um valor maior que zero.', variant: 'destructive' });
        return;
      }
      const result = await pagamentosService.criarPix({
        churchId: effectiveChurchId,
        valor,
        descricao: 'Teste de doação',
        tipo: 'doacao',
      });
      if (result.qr_code_url) setQrCodeUrl(result.qr_code_url);
      if (result.checkout_url) setCheckoutUrl(result.checkout_url);
      toast({ title: 'Teste criado!', description: 'Se o QR Code aparecer, está tudo certo.' });
      setStep(5);
    } catch (e: any) {
      toast({ title: 'Erro no teste', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  if (!effectiveChurchId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <CreditCard className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma igreja</h2>
        <p className="text-muted-foreground">É necessário ter uma igreja vinculada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Ativar pagamentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Siga as etapas para habilitar doações (Stone/Pagar.me) na sua igreja.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/pix-donacoes')}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Progresso
          </CardTitle>
          <CardDescription>Cadastro → Configuração → Teste → Ativo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {steps.map((s) => (
              <div key={s.n} className="flex items-center gap-2 rounded-xl border bg-muted/10 px-3 py-2">
                <StepDot done={step > s.n || (s.n === 5 && isActive)} />
                <span className={`text-sm font-semibold ${step === s.n ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadastro da igreja</CardTitle>
          <CardDescription>Confirme se sua igreja tem os dados mínimos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border bg-muted/10 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{church?.name || 'Igreja'}</p>
                  <p className="text-xs text-muted-foreground">CNPJ: <span className="font-mono">{church?.cnpj || 'não informado'}</span></p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black border ${church?.name ? 'bg-emerald-600 text-white border-emerald-700/30' : 'bg-amber-500 text-white border-amber-600/30'}`}>
                  {church?.name ? 'OK' : 'Pendente'}
                </span>
              </div>

              <Button onClick={() => setStep(2)} disabled={!church?.name}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escolher modo</CardTitle>
          <CardDescription>
            - Já tenho conta Stone (MEI / Direct) <br />
            - Quero criar conta (Marketplace recomendado)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => { setMode('direct'); setStep(3); }}
            className={`text-left rounded-2xl border p-4 transition-all ${mode === 'direct' ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-primary/5'}`}
          >
            <p className="font-black">Já tenho conta Stone</p>
            <p className="text-sm text-muted-foreground mt-1">Usa API Key por igreja (menos recomendado para produção).</p>
            {canEdit && (
              <div className="mt-3">
                <Button variant="outline" size="sm" disabled={busy} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveMode('direct'); }}>
                  Selecionar MEI
                </Button>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setMode('marketplace'); setStep(3); }}
            className={`text-left rounded-2xl border p-4 transition-all ${mode === 'marketplace' ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-primary/5'}`}
          >
            <p className="font-black">Quero criar conta</p>
            <p className="text-sm text-muted-foreground mt-1">Marketplace: chave só no servidor e recipient por igreja.</p>
            {canEdit && (
              <div className="mt-3">
                <Button variant="outline" size="sm" disabled={busy} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveMode('marketplace'); }}>
                  Selecionar Marketplace
                </Button>
              </div>
            )}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>Complete a configuração do modo escolhido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'direct' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="stone_api_key">API Key da Stone</Label>
                <Input
                  id="stone_api_key"
                  type="password"
                  placeholder="Cole aqui a API Key"
                  value={stoneApiKey}
                  onChange={(e) => setStoneApiKey(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <Button onClick={handleConnectDirect} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Conectar conta
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border bg-muted/10 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Status da conta</p>
                  <p className="text-xs text-muted-foreground">
                    Recipient: <span className="font-mono">{church?.stone_recipient_id ? 'configurado' : 'não configurado'}</span>
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black border ${church?.stone_recipient_id ? 'bg-emerald-600 text-white border-emerald-700/30' : 'bg-amber-500 text-white border-amber-600/30'}`}>
                  {church?.stone_recipient_id ? 'Ativa' : 'Não ativada'}
                </span>
              </div>
              {canEdit && (
                <Button onClick={handleActivateMarketplace} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Ativar pagamentos
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste</CardTitle>
          <CardDescription>Crie um PIX de teste para validar o fluxo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test_amount">Valor do teste (R$)</Label>
            <Input
              id="test_amount"
              inputMode="decimal"
              placeholder="Ex: 10,00"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleTest} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
            Gerar PIX de teste
          </Button>

          {qrCodeUrl && (
            <div className="mt-2 space-y-2">
              <Label>QR Code</Label>
              <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48 border rounded-md" />
            </div>
          )}

          {checkoutUrl && !qrCodeUrl && (
            <div className="mt-2">
              <a
                className="text-sm text-primary underline underline-offset-4"
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir checkout
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ativo</CardTitle>
          <CardDescription>Quando estiver ativo, você já pode receber doações.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Modo atual: <span className="font-mono">{String(church?.stone_mode || '—')}</span></p>
            <p className="text-xs text-muted-foreground">
              {String(church?.stone_mode || '').toLowerCase() === 'marketplace'
                ? `Recipient: ${church?.stone_recipient_id ? 'configurado' : 'não configurado'}`
                : 'API Key: ' + (String(church?.stone_api_key || '').trim() ? 'configurada' : 'não configurada')}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black border ${isActive ? 'bg-emerald-600 text-white border-emerald-700/30' : 'bg-amber-500 text-white border-amber-600/30'}`}>
            {isActive ? 'ATIVO' : 'PENDENTE'}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

