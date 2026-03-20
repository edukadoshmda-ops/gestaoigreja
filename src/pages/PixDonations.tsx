import { useState, useEffect } from 'react';
import { Save, Loader2, DollarSign, CreditCard, Copy, Check, QrCode } from 'lucide-react';
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
import { ministriesService } from '@/services/ministries.service';
import { QrCodePix } from 'qrcode-pix';
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
  const [ministries, setMinistries] = useState<any[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>('');
  const [genAmount, setGenAmount] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [copyPaste, setCopyPaste] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (effectiveChurchId) {
      loadData();
      loadMinistries();
    }
  }, [effectiveChurchId]);

  async function loadMinistries() {
    try {
      const data = await ministriesService.getActive();
      setMinistries(data || []);
    } catch (e) {
      console.error('Erro ao carregar ministérios', e);
    }
  }

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

  async function handleGeneratePix() {
    if (!church?.pix_key) {
      toast({
        title: 'Configuração incompleta',
        description: 'Configure a chave PIX da igreja primeiro.',
        variant: 'destructive',
      });
      return;
    }

    const ministry = ministries.find((m) => m.id === selectedMinistryId);
    if (!selectedMinistryId || !ministry) {
      toast({
        title: 'Selecione um ministério',
        description: 'Escolha para qual ministério deseja gerar o PIX.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const valor = genAmount ? Number(genAmount.replace(',', '.')) : undefined;
      const description = `Doação ${ministry.name}`.substring(0, 25); // PIX tem limite de 25 chars em alguns campos

      const sdk = QrCodePix({
        version: '01',
        key: church.pix_key,
        name: church.pix_beneficiary_name || church.name || 'Igreja',
        city: church.pix_city || 'BR',
        message: description,
        value: valor,
      });

      const b64 = await sdk.base64();
      const payload = sdk.payload();

      setQrCode(b64);
      setCopyPaste(payload);
      toast({ title: 'PIX Gerado!', description: 'QR Code e código Copia e Cola prontos.' });
    } catch (e: any) {
      toast({
        title: 'Erro ao gerar PIX',
        description: e.message,
        variant: 'destructive',
      });
    }
  }

  function handleCopy() {
    if (!copyPaste) return;
    navigator.clipboard.writeText(copyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copiado!', description: 'Código PIX copiado para a área de transferência.' });
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
            <QrCode className="h-5 w-5" />
            Gerar QR Code PIX (Ministérios)
          </CardTitle>
          <CardDescription>
            Gere um QR Code PIX para um ministério específico com descrição automática.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Ministério</Label>
            <Select value={selectedMinistryId} onValueChange={setSelectedMinistryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ministério" />
              </SelectTrigger>
              <SelectContent>
                {ministries.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gen_amount">Valor (opcional)</Label>
            <Input
              id="gen_amount"
              placeholder="Ex: 50,00"
              value={genAmount}
              onChange={(e) => setGenAmount(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleGeneratePix} variant="outline">
            <QrCode className="mr-2 h-4 w-4" />
            Gerar PIX
          </Button>

          {qrCode && (
            <div className="mt-6 flex flex-col items-center space-y-4 border rounded-lg p-6 bg-muted/5 font-primary">
              <div className="bg-white p-2 rounded-lg border shadow-sm">
                <img src={qrCode} alt="QR Code PIX" className="w-48 h-48" />
              </div>
              
              <div className="w-full space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold">PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={copyPaste} 
                    className="flex-1 font-mono text-xs overflow-hidden text-ellipsis h-9" 
                  />
                  <Button size="icon" variant="secondary" onClick={handleCopy} className="h-9 w-9">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
