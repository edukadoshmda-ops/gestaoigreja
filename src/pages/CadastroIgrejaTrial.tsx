import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Church, User, Image, Mail, Lock, Eye, EyeOff, Download, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import type { TrialChurchFormData } from '@/services/trial.service';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

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
  pastorEmail: '',
  pastorPassword: '',
  logoUrl: '',
};

export default function CadastroIgrejaTrial() {
  useDocumentTitle('Cadastrar Igreja');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<TrialChurchFormData>(initialForm);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof TrialChurchFormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const optimized = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, quality: 0.82 });
      const ext = (optimized instanceof File ? optimized.name : file.name).split('.').pop() || 'webp';
      const path = `logos/trial-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('church-documents')
        .upload(path, optimized, {
          cacheControl: STORAGE_CACHE_CONTROL,
          contentType: optimized.type || file.type,
        });
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
    if (!termsAccepted) {
      toast({ title: 'Atenção', description: 'Você precisa aceitar os termos para continuar.', variant: 'destructive' });
      return;
    }
    if (!form.name.trim()) {
      toast({ title: 'Preencha o nome da igreja', variant: 'destructive' });
      return;
    }
    if (!form.pastorEmail.trim()) {
      toast({ title: 'Preencha o e-mail do pastor', variant: 'destructive' });
      return;
    }
    if (form.pastorPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // Cria a conta do pastor no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.pastorEmail.trim(),
        password: form.pastorPassword,
        options: {
          data: {
            full_name: form.pastorName || 'Pastor',
            role: 'pastor',
          }
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        throw authError;
      }

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      sessionStorage.setItem('trial_signup', '1');
      toast({ title: 'Conta criada!', description: 'Redirecionando para o pagamento para ativar sua conta.' });
      navigate('/checkout');
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col items-center gap-4 mb-4">
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
                <Label htmlFor="cnpj">CPF ou CNPJ</Label>
                <Input
                  id="cnpj"
                  value={form.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
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
              <div className="space-y-2">
                <Label htmlFor="pastorEmail" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  E-mail de Acesso do Pastor *
                </Label>
                <Input
                  id="pastorEmail"
                  type="email"
                  value={form.pastorEmail}
                  onChange={(e) => handleChange('pastorEmail', e.target.value)}
                  placeholder="pastor@minhaigreja.com"
                  required
                />
                <p className="text-[10px] text-muted-foreground">O pastor usará este e-mail para acessar o sistema.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastorPassword" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Senha de Acesso *
                </Label>
                <div className="relative">
                  <Input
                    id="pastorPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={form.pastorPassword}
                    onChange={(e) => handleChange('pastorPassword', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Esta será a senha usada para entrar no app.</p>
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
                  {form.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-primary"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = form.logoUrl;
                        link.download = 'logo-igreja.png';
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Logo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Banner da Tela de Login */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Imagem da Tela de Login
              </CardTitle>
              <CardDescription>Banner que aparece na tela de login da sua igreja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-40 h-24 rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
                  {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-row flex-wrap gap-2">
                  <label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary text-primary text-sm font-medium cursor-pointer hover:bg-primary/10 transition-all">
                      {uploadingBanner
                        ? <><div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /><span>Enviando...</span></>
                        : <><ImageIcon className="h-4 w-4" /><span>Selecionar imagem</span></>}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingBanner}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingBanner(true);
                        try {
                          const optimized = await compressImageFile(file, { maxWidth: 1400, maxHeight: 800, quality: 0.80 });
                          const ext = (optimized instanceof File ? optimized.name : file.name).split('.').pop() || 'webp';
                          const path = `banner-trial-${Date.now()}.${ext}`;
                          const { data, error } = await supabase.storage
                            .from('banners')
                            .upload(path, optimized, {
                              upsert: true,
                              contentType: optimized.type || file.type,
                              cacheControl: STORAGE_CACHE_CONTROL,
                            });
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage
                            .from('banners')
                            .getPublicUrl(data.path);
                          setBannerUrl(publicUrl);
                          toast({ title: 'Banner enviado!', description: 'Imagem carregada com sucesso.' });
                        } catch (err: any) {
                          toast({ title: 'Erro ao enviar banner', description: err?.message, variant: 'destructive' });
                        } finally {
                          setUploadingBanner(false);
                        }
                      }}
                    />
                  </label>
                  {bannerUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = bannerUrl;
                        link.download = 'banner-login.jpg';
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex items-start gap-3">
              <Checkbox 
                id="terms" 
                checked={termsAccepted} 
                onCheckedChange={(c) => setTermsAccepted(c === true)} 
                className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <div className="space-y-1.5">
                <Label htmlFor="terms" className="text-sm font-semibold leading-none cursor-pointer">
                  Li e concordo com os termos do serviço
                </Label>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Na falta de pagamento o serviço é pausado. O serviço pode ser cancelado a qualquer momento sem prejuízo de multas. O pagamento é cobrado após 30 dias da data da contratação.
                </p>
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
