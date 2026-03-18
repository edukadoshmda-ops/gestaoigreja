import { useState, useEffect } from 'react';
import { Save, Loader2, DollarSign, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { churchesService } from '@/services/churches.service';
import { pagamentosService } from '@/services/pagamentos.service';
import { criarContaStone } from '@/lib/pagarme';
import { Link } from 'react-router-dom';

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
] as const;

export default function PixDonations() {
  useDocumentTitle('Doar dízimos e ofertas');
  const { churchId, viewingChurch, user } = useAuth();
  const { toast } = useToast();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;

  const canEdit = ['admin', 'pastor', 'secretario', 'superadmin'].includes(
    user?.role || ''
  );

  const [church, setChurch] = useState<{
    name?: string | null;
    pix_key?: string | null;
    pix_key_type?: string | null;
    pix_beneficiary_name?: string | null;
    pix_city?: string | null;
    cnpj?: string | null;
    stone_recipient_id?: string | null;
    stone_mode?: string | null;
    stone_api_key?: string | null;
    stone_status?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStone, setConnectingStone] = useState(false);
  const [activatingMarketplace, setActivatingMarketplace] = useState(false);
  const [creatingPix, setCreatingPix] = useState(false);
  const [donationAmount, setDonationAmount] = useState<string>('10');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (effectiveChurchId) loadData();
  }, [effectiveChurchId]);

  async function loadData() {
    if (!effectiveChurchId) return;
    setLoading(true);
    try {
      const churchData = await churchesService.getById(effectiveChurchId);
      setChurch(churchData as any);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePixConfig() {
    if (!effectiveChurchId || !church || !canEdit) return;
    setSaving(true);
    try {
      await churchesService.update(effectiveChurchId, {
        pix_key: church.pix_key || null,
        pix_key_type: church.pix_key_type || null,
        pix_beneficiary_name: church.pix_beneficiary_name || null,
        pix_city: church.pix_city || null,
      });
      toast({ title: 'Salvo!', description: 'Dados PIX atualizados.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateStonePixDonation() {
    if (!effectiveChurchId) return;
    setCreatingPix(true);
    setCheckoutUrl(null);
    setQrCodeUrl(null);
    try {
      const valor = Number(String(donationAmount).replace(',', '.'));
      if (!Number.isFinite(valor) || valor <= 0) {
        toast({
          title: 'Valor inválido',
          description: 'Informe um valor maior que zero.',
          variant: 'destructive',
        });
        return;
      }

      const result = await pagamentosService.criarPix({
        churchId: effectiveChurchId,
        valor,
        descricao: 'Doação',
        tipo: 'doacao',
      });

      if (result.qr_code_url) {
        setQrCodeUrl(result.qr_code_url);
        toast({
          title: 'PIX criado!',
          description: 'Exiba o QR Code para o membro escanear.',
        });
      } else if (result.checkout_url) {
        setCheckoutUrl(result.checkout_url);
        window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
        toast({
          title: 'PIX criado!',
          description: 'Abrimos o checkout em uma nova aba.',
        });
      } else {
        toast({
          title: 'PIX criado!',
          description: 'Pagamento registrado. Confira os detalhes no painel de pagamentos.',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Erro ao criar PIX',
        description: e?.message || String(e),
        variant: 'destructive',
      });
    } finally {
      setCreatingPix(false);
    }
  }

  async function handleConnectStoneMei() {
    if (!effectiveChurchId || !church || !canEdit) return;
    const key = String(church.stone_api_key || '').trim();
    if (!key) {
      toast({
        title: 'Informe a API Key',
        description: 'Cole a API Key da Stone/Pagar.me para conectar a conta.',
        variant: 'destructive',
      });
      return;
    }

    setConnectingStone(true);
    try {
      await churchesService.update(effectiveChurchId, {
        stone_mode: 'direct',
        stone_api_key: key,
      } as any);
      toast({
        title: 'Conta conectada!',
        description: 'A API Key foi salva e o modo foi definido como Direct (MEI).',
      });
      await loadData();
    } catch (e: any) {
      toast({
        title: 'Erro ao conectar',
        description: e?.message || String(e),
        variant: 'destructive',
      });
    } finally {
      setConnectingStone(false);
    }
  }

  function getMarketplaceStatusLabel() {
    const mode = String(church?.stone_mode || '').toLowerCase();
    if (mode === 'direct') return { label: 'MEI (Direct) ativo', tone: 'muted' as const };
    if (church?.stone_recipient_id) return { label: 'Conta marketplace ativa', tone: 'success' as const };
    if (church?.stone_status) return { label: `Pendente (${church.stone_status})`, tone: 'warning' as const };
    return { label: 'Não ativada', tone: 'warning' as const };
  }

  async function handleActivateMarketplace() {
    if (!effectiveChurchId || !church || !canEdit) return;
    setActivatingMarketplace(true);
    try {
      // 1) Define marketplace como modo (recomendado)
      await churchesService.update(effectiveChurchId, {
        stone_mode: 'marketplace',
        // segurança: limpamos a chave da igreja ao migrar para marketplace
        stone_api_key: null,
      } as any);

      // 2) Se ainda não tem recipient, cria via endpoint seguro no backend
      const cnpj = String((church as any)?.cnpj || '').trim();
      const nome = String((church as any)?.name || '').trim();
      if (!church.stone_recipient_id) {
        if (!cnpj || !nome) {
          toast({
            title: 'Dados incompletos',
            description: 'Para ativar o marketplace, a igreja precisa ter Nome e CNPJ cadastrados.',
            variant: 'destructive',
          });
        } else {
          await criarContaStone({ church_id: effectiveChurchId, nome, cnpj });
        }
      }

      toast({
        title: 'Pagamentos ativados!',
        description: 'Modo marketplace configurado com sucesso.',
      });
      await loadData();
    } catch (e: any) {
      toast({
        title: 'Erro ao ativar',
        description: e?.message || String(e),
        variant: 'destructive',
      });
    } finally {
      setActivatingMarketplace(false);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-primary" />
          Doar dízimos e ofertas
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure as chaves PIX e dados bancários da igreja para recebimento de dízimos e ofertas.
        </p>
        <div className="mt-3">
          <Link to="/dashboard/pagamentos" className="inline-flex">
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Ativar pagamentos (passo a passo)
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Chave PIX da igreja
          </CardTitle>
          <CardDescription>
            Cadastre a chave PIX para que os membros possam fazer transferências e doações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Tipo da chave</Label>
                <Select
                  value={church?.pix_key_type || ''}
                  onValueChange={(v) =>
                    setChurch((p) => (p ? { ...p, pix_key_type: v || null } : null))
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIX_KEY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input
                  id="pix_key"
                  placeholder="email@igreja.com.br ou CPF/CNPJ/telefone"
                  value={church?.pix_key || ''}
                  onChange={(e) =>
                    setChurch((p) => (p ? { ...p, pix_key: e.target.value || null } : null))
                  }
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pix_name">Nome do beneficiário</Label>
                <Input
                  id="pix_name"
                  placeholder="Nome da igreja ou associação"
                  maxLength={25}
                  value={church?.pix_beneficiary_name || ''}
                  onChange={(e) =>
                    setChurch((p) =>
                      p ? { ...p, pix_beneficiary_name: e.target.value || null } : null
                    )
                  }
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pix_city">Cidade (UF)</Label>
                <Input
                  id="pix_city"
                  placeholder="Ex: SAO PAULO SP"
                  maxLength={15}
                  value={church?.pix_city || ''}
                  onChange={(e) =>
                    setChurch((p) => (p ? { ...p, pix_city: e.target.value || null } : null))
                  }
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <Button onClick={handleSavePixConfig} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar dados PIX
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Fase MEI
          </CardTitle>
          <CardDescription>
            Configure a API Key da Stone/Pagar.me diretamente na igreja (modo <code>direct</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="stone_api_key">API Key da Stone</Label>
                <Input
                  id="stone_api_key"
                  type="password"
                  placeholder="Cole aqui a API Key"
                  value={church?.stone_api_key || ''}
                  onChange={(e) =>
                    setChurch((p) => (p ? { ...p, stone_api_key: e.target.value || null } : null))
                  }
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Para produção, o recomendado é <strong>marketplace</strong> (chave só no servidor). Nesta fase, usamos direct.
                </p>
              </div>

              {canEdit && (
                <Button onClick={handleConnectStoneMei} disabled={connectingStone}>
                  {connectingStone ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Conectar conta
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Fase Marketplace
          </CardTitle>
          <CardDescription>
            Recomendado para produção: pagamentos pela conta da plataforma com repasse automático para a igreja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border bg-muted/10 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Status da conta</p>
                  <p className="text-xs text-muted-foreground">
                    Recipient: <span className="font-mono">{church?.stone_recipient_id ? 'configurado' : 'não configurado'}</span>
                  </p>
                </div>
                {(() => {
                  const s = getMarketplaceStatusLabel();
                  const cls =
                    s.tone === 'success'
                      ? 'bg-emerald-600 text-white border-emerald-700/30'
                      : s.tone === 'warning'
                        ? 'bg-amber-500 text-white border-amber-600/30'
                        : 'bg-muted text-foreground border-border';
                  return (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black border ${cls}`}>
                      {s.label}
                    </span>
                  );
                })()}
              </div>

              {canEdit && (
                <Button onClick={handleActivateMarketplace} disabled={activatingMarketplace}>
                  {activatingMarketplace ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Ativar pagamentos
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Doação via Stone/Pagar.me (PIX)
          </CardTitle>
          <CardDescription>
            Teste o fluxo de pagamento PIX criando um pedido via Stone/Pagar.me e registrando em <code>payments</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !church?.stone_recipient_id ? (
            <div className="text-sm text-muted-foreground">
              Esta igreja ainda não tem <code>stone_recipient_id</code>. Crie a conta Stone primeiro usando o endpoint
              <code> /api/criar-conta-stone</code>.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="donation_amount">Valor da doação (R$)</Label>
                <Input
                  id="donation_amount"
                  inputMode="decimal"
                  placeholder="Ex: 10,00"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={handleCreateStonePixDonation} disabled={creatingPix}>
                  {creatingPix ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Criar PIX (Stone)
                </Button>
              </div>

              {qrCodeUrl && (
                <div className="mt-4 space-y-2">
                  <Label>QR Code PIX</Label>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-48 h-48 border rounded-md"
                  />
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
