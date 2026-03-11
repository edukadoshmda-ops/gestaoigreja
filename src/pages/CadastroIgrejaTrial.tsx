import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Church, User, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import type { TrialChurchFormData } from '@/services/trial.service';

const STORAGE_KEY = 'trial_church_form_data';

const initialForm: TrialChurchFormData = {
  name: '',
  cnpj: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  cep: '',
  city: '',
  state: '',
  pastorName: '',
  pastorPhone: '',
  logoUrl: '',
};

export default function CadastroIgrejaTrial() {
  useDocumentTitle('Cadastrar Igreja - Teste 30 dias');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<TrialChurchFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof TrialChurchFormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `logos/trial-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('church-documents')
        .upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('church-documents')
        .getPublicUrl(path);
      handleChange('logoUrl', publicUrl);
      toast({ title: 'Logo enviada!', description: 'Imagem carregada com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao enviar logo', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Preencha o nome da igreja', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      sessionStorage.setItem('trial_signup', '1');
      toast({ title: 'Dados salvos!', description: 'Agora faça login ou cadastre-se para completar.' });
      navigate('/login?trial=1');
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Gift className="h-7 w-7 text-primary" />
              Cadastrar Igreja - Teste 30 dias
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados da sua igreja e comece o período de teste gratuito.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="h-5 w-5 text-primary" />
                Dados da Igreja
              </CardTitle>
              <CardDescription>Informações institucionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Igreja *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Igreja Batista Central"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={form.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contato@igreja.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="(11) 3333-4444"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={form.cep}
                    onChange={(e) => handleChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Pastor Presidente
              </CardTitle>
              <CardDescription>Dados do responsável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pastorName">Nome do Pastor</Label>
                <Input
                  id="pastorName"
                  value={form.pastorName}
                  onChange={(e) => handleChange('pastorName', e.target.value)}
                  placeholder="Ex: Pr. João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastorPhone">Contato do Pastor</Label>
                <Input
                  id="pastorPhone"
                  value={form.pastorPhone}
                  onChange={(e) => handleChange('pastorPhone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Logo da Igreja
              </CardTitle>
              <CardDescription>Envie o logo para exibir no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Image className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploadingLogo ? 'Enviando...' : 'Selecionar imagem'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Continuar para login'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/login')}>
              Já tenho conta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
