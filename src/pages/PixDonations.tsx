import { useState, useEffect } from 'react';
import { QrCode, Save, Loader2, Copy, Check, DollarSign, Calendar } from 'lucide-react';
import { QrCodePix } from 'qrcode-pix';
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
import { eventsService } from '@/services/events.service';

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
] as const;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
}

export default function PixDonations() {
  useDocumentTitle('PIX e QR Code');
  const { churchId, viewingChurch, user } = useAuth();
  const { toast } = useToast();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;

  const canEdit = ['admin', 'pastor', 'secretario', 'tesoureiro', 'superadmin'].includes(
    user?.role || ''
  );

  const [church, setChurch] = useState<{
    pix_key?: string | null;
    pix_key_type?: string | null;
    pix_beneficiary_name?: string | null;
    pix_city?: string | null;
  } | null>(null);
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    date: string;
    registration_fee: number | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [donationValue, setDonationValue] = useState('');
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrContext, setQrContext] = useState<{ label: string; value?: number } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    if (effectiveChurchId) loadData();
  }, [effectiveChurchId]);

  async function loadData() {
    if (!effectiveChurchId) return;
    setLoading(true);
    try {
      const [churchData, eventsData] = await Promise.all([
        churchesService.getById(effectiveChurchId),
        eventsService.getUpcoming(),
      ]);
      setChurch(churchData as any);
      const withFee = (eventsData as any[]).filter(
        (e: any) =>
          (!effectiveChurchId || e.church_id === effectiveChurchId) &&
          e.registration_fee != null &&
          Number(e.registration_fee) > 0
      );
      setEvents(withFee);
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

  async function generateQr(
    value: number | undefined,
    message: string,
    transactionId: string
  ): Promise<boolean> {
    if (
      !church?.pix_key ||
      !church?.pix_beneficiary_name ||
      !church?.pix_city
    ) {
      toast({
        title: 'Configure os dados PIX',
        description: 'Chave, nome do beneficiário e cidade são obrigatórios.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const qr = QrCodePix({
        version: '01',
        key: church.pix_key.trim(),
        name: church.pix_beneficiary_name.trim().slice(0, 25),
        city: church.pix_city.trim().toUpperCase().slice(0, 25),
        transactionId: transactionId.slice(0, 25),
        message: message.slice(0, 72),
        value: value != null && value > 0 ? Number(value.toFixed(2)) : undefined,
      });
      const payload = qr.payload();
      const base64 = await qr.base64();
      setQrPayload(payload);
      setQrBase64(base64);
      setQrContext({ label: message, value });
      return true;
    } catch (e: any) {
      toast({
        title: 'Erro ao gerar QR Code',
        description: e?.message || 'Verifique os dados PIX.',
        variant: 'destructive',
      });
      return false;
    }
  }

  function parseDonationValue(raw: string): number {
    const cleaned = raw.replace(/[^\d,.]/g, '').replace(',', '.');
    if (!cleaned) return 0;
    const parts = cleaned.split('.');
    if (parts.length > 1) {
      return parseFloat(parts[0] + '.' + parts.slice(1).join(''));
    }
    return parseFloat(cleaned) || 0;
  }

  function handleDonationQr() {
    const num = parseDonationValue(donationValue);
    const hasValue = num > 0;
    const id = `DZ${Date.now().toString(36).toUpperCase().slice(-12)}`;
    generateQr(hasValue ? num : undefined, hasValue ? 'Dízimo/Oferta' : 'Doação livre', id);
  }

  function handleEventQr(event: (typeof events)[0]) {
    const fee = Number(event.registration_fee) || 0;
    const id = `EV${event.id.slice(0, 8)}${Date.now().toString(36).toUpperCase().slice(-6)}`;
    generateQr(fee, `Evento: ${event.title}`, id);
  }

  async function copyPayload() {
    if (!qrPayload) return;
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopiedPayload(true);
      toast({ title: 'Copiado!', description: 'Código PIX copiado para a área de transferência.' });
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  }

  if (!effectiveChurchId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <QrCode className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma igreja</h2>
        <p className="text-muted-foreground">É necessário ter uma igreja vinculada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <QrCode className="h-8 w-8 text-primary" />
          PIX e QR Code
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure a chave PIX da igreja e gere QR Codes para dízimos, ofertas e eventos.
        </p>
      </div>

      {/* Config PIX da igreja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Dados PIX da igreja
          </CardTitle>
          <CardDescription>
            Chave e beneficiário usados para gerar os QR Codes. Esses dados ficam salvos na igreja.
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
                  placeholder="Nome da igreja ou pessoa jurídica"
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
                  placeholder="SAO PAULO"
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

      {/* Dízimos e ofertas */}
      <Card>
        <CardHeader>
          <CardTitle>Dízimos e Ofertas</CardTitle>
          <CardDescription>
            Informe o valor (opcional) e gere o QR Code para doação. Deixe em branco para valor livre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[160px]">
              <Input
                placeholder="Valor (R$)"
                value={donationValue}
                onChange={(e) => setDonationValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDonationQr()}
              />
            </div>
            <Button onClick={handleDonationQr}>
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Eventos com taxa */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Eventos com taxa de inscrição
            </CardTitle>
            <CardDescription>
              Eventos com valor definido. Clique para gerar o QR Code de pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(ev.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">
                      {formatCurrency(Number(ev.registration_fee) || 0)}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleEventQr(ev)}>
                      <QrCode className="h-4 w-4 mr-1" />
                      QR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal/área do QR gerado */}
      {qrBase64 && qrContext && (
        <Card className="border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle>{qrContext.label}</CardTitle>
            <CardDescription>
              {qrContext.value != null && qrContext.value > 0
                ? `Valor: ${formatCurrency(qrContext.value)}`
                : 'Valor livre - o doador informa no app do banco'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-xl">
              <img src={qrBase64} alt="QR Code PIX" className="w-48 h-48" />
            </div>
            <Button variant="outline" onClick={copyPayload} className="w-full max-w-xs">
              {copiedPayload ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copiedPayload ? 'Copiado!' : 'Copiar código PIX'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Ou escaneie o QR Code com o app do seu banco.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
