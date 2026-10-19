import { useState, useEffect } from 'react';
import { Building2, Upload, Save, Download, Landmark, User, Phone, Mail, MapPin, ImageIcon, Loader2, Copy, ExternalLink, Link2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabaseClient';
import { churchesService } from '@/services/churches.service';
import { trialService } from '@/services/trial.service';
import { DEFAULT_CHURCH_NAME } from '@/lib/constants';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

const DEFAULT_LOGO = '/logo-app.png?v=2';

export default function Institutional() {
  useDocumentTitle('Página Institucional');
  const { toast } = useToast();
  const { user, churchId, viewingChurch } = useAuth();
  const { canEditInstitutional } = usePermissions();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;
  const canEdit = canEditInstitutional;

  const [churchData, setChurchData] = useState({
    name: DEFAULT_CHURCH_NAME,
    slug: '',
    address: '',
    phone: '',
    email: '',
    about: '',
    logoUrl: '',
    bannerUrl: '',
    presidentName: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (effectiveChurchId) loadChurch();
    else setLoading(false);
  }, [effectiveChurchId]);

  async function loadChurch() {
    if (!effectiveChurchId) return;
    setLoading(true);
    try {
      const church = await churchesService.getById(effectiveChurchId) as any;
      setChurchData({
        name: church?.name || DEFAULT_CHURCH_NAME,
        slug: church?.slug || '',
        address: church?.address || '',
        phone: church?.phone || '',
        email: church?.email || '',
        about: church?.about || '',
        logoUrl: church?.logo_url || '',
        bannerUrl: church?.banner_url || '',
        presidentName: church?.president_name || '',
      });
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e?.message, variant: 'destructive' });
      setChurchData((p) => ({ ...p, name: DEFAULT_CHURCH_NAME, slug: '' }));
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!effectiveChurchId || !canEdit) return;
    setSaving(true);
    try {
      await churchesService.update(effectiveChurchId, {
        name: churchData.name,
        address: churchData.address,
        phone: churchData.phone,
        email: churchData.email,
        about: churchData.about,
        logo_url: churchData.logoUrl || null,
        banner_url: churchData.bannerUrl || null,
        president_name: churchData.presidentName || null,
      } as any);
      const nameFilled = churchData.name?.trim() && churchData.name !== DEFAULT_CHURCH_NAME;
      const presidentFilled = churchData.presidentName?.trim();
      if (nameFilled && presidentFilled) {
        await trialService.setInstitutionalCompleted(effectiveChurchId);
      }
      toast({ title: 'Dados salvos!', description: 'As informações institucionais foram atualizadas.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadLogo = async () => {
    const logoUrl = churchData.logoUrl || DEFAULT_LOGO;
    const fullUrl = logoUrl.startsWith('http') ? logoUrl : `${window.location.origin}${logoUrl}`;
    const fileName = `logo-${churchData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    try {
      const res = await fetch(fullUrl, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Download iniciado', description: 'A logo foi enviada para download.' });
    } catch {
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Download iniciado', description: 'A logo foi aberta em nova aba.' });
    }
  };

  if (!effectiveChurchId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Landmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma igreja</h2>
        <p className="text-muted-foreground">É necessário ter uma igreja vinculada para ver os dados institucionais.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-8 w-8 text-primary" />
            Página Institucional
          </h1>
          <p className="text-muted-foreground mt-1">
            Dados da igreja, logo e ambiente para download
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto shadow-md">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando…' : 'Salvar Alterações'}
          </Button>
        )}
      </div>

      {/* Card: Link Exclusivo de Login da Igreja */}
      {churchData.slug && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <Link2 className="h-5 w-5" />
              Link Exclusivo de Login para Membros
            </CardTitle>
            <CardDescription>
              Compartilhe este link com seus membros e líderes. Quem acessar por ele vai direto para a tela de login personalizada da sua igreja, sem passar pela página de apresentação do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/login?church=${churchData.slug}`}
                className="bg-background font-mono text-xs sm:text-sm select-all"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  className="gap-2 shadow-sm"
                  onClick={() => {
                    const url = `${window.location.origin}/login?church=${churchData.slug}`;
                    navigator.clipboard.writeText(url);
                    toast({
                      title: 'Link copiado!',
                      description: 'O link exclusivo de login da sua igreja foi copiado para a área de transferência.',
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Testar link em nova aba"
                  onClick={() => {
                    window.open(`${window.location.origin}/login?church=${churchData.slug}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>💡 <strong>Link alternativo amigável:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{`${window.location.origin}/igreja/${churchData.slug}`}</code></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card: Dados da Igreja + Logo + Presidente + Download */}
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="h-2 bg-primary/20 w-full" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            Dados da Igreja
          </CardTitle>
          <CardDescription>Informações institucionais exibidas para todos os membros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo + Download */}
            <div className="md:col-span-1 flex flex-col items-center gap-4">
              <div className="w-full max-w-[180px] aspect-square rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center p-4">
                <img
                  src={churchData.logoUrl || DEFAULT_LOGO}
                  alt="Logo da Igreja"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }}
                />
              </div>
              {/* Botões: Upload Logo e Download Logo */}
              <div className="flex flex-row flex-wrap gap-2 w-full max-w-[180px]">
                {canEdit && (
                  <label className="flex-1">
                    <div className="flex items-center justify-center gap-1 w-full px-3 py-2 rounded-xl border border-primary text-primary text-sm font-medium cursor-pointer hover:bg-primary/10 transition-all">
                      {uploadingLogo
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Upload className="h-4 w-4" />}
                      <span>{uploadingLogo ? 'Enviando...' : 'Trocar Logo'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !effectiveChurchId) return;
                        setUploadingLogo(true);
                        try {
                          const optimized = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, quality: 0.82 });
                          const ext = (optimized instanceof File ? optimized.name : file.name).split('.').pop();
                          const fileName = `logo-${effectiveChurchId}-${Date.now()}.${ext}`;
                          const { data, error } = await supabase.storage
                            .from('logos')
                            .upload(fileName, optimized, {
                              upsert: true,
                              contentType: optimized.type || file.type,
                              cacheControl: STORAGE_CACHE_CONTROL,
                            });
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage
                            .from('logos')
                            .getPublicUrl(data.path);
                          setChurchData(prev => ({ ...prev, logoUrl: publicUrl }));
                          toast({ title: 'Logo atualizada!', description: 'Clique em "Salvar Alterações" para aplicar.' });
                        } catch (err: any) {
                          toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                  </label>
                )}
                {churchData.logoUrl && (
                  <Button variant="outline" onClick={handleDownloadLogo} className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                )}
              </div>
            </div>

            {/* Dados textuais */}
            <div className="md:col-span-2 space-y-4">
              {canEdit ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Igreja</Label>
                    <Input
                      id="name"
                      value={churchData.name}
                      onChange={(e) => setChurchData({ ...churchData, name: e.target.value })}
                      placeholder="Ex: Igreja Sede"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="president">Nome do Presidente</Label>
                    <Input
                      id="president"
                      value={churchData.presidentName}
                      onChange={(e) => setChurchData({ ...churchData, presidentName: e.target.value })}
                      placeholder="Ex: Pr. João Silva"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={churchData.phone}
                        onChange={(e) => setChurchData({ ...churchData, phone: e.target.value })}
                        placeholder="(11) 3333-4444"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={churchData.email}
                        onChange={(e) => setChurchData({ ...churchData, email: e.target.value })}
                        placeholder="contato@igreja.com.br"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={churchData.address}
                      onChange={(e) => setChurchData({ ...churchData, address: e.target.value })}
                      placeholder="Av. Principal, 1000 - Centro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about">Sobre a Igreja</Label>
                    <Textarea
                      id="about"
                      value={churchData.about}
                      onChange={(e) => setChurchData({ ...churchData, about: e.target.value })}
                      placeholder="Somos uma igreja comprometida com o evangelho..."
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="text-lg font-semibold">{churchData.name}</p>
                  </div>
                  {churchData.presidentName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Presidente</p>
                        <p className="font-semibold">{churchData.presidentName}</p>
                      </div>
                    </div>
                  )}
                  {churchData.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <p>{churchData.phone}</p>
                    </div>
                  )}
                  {churchData.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <p>{churchData.email}</p>
                    </div>
                  )}
                  {churchData.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <p>{churchData.address}</p>
                    </div>
                  )}
                  {churchData.about && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Sobre</p>
                      <p className="text-sm">{churchData.about}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload + Download banner (apenas admin) */}
          {canEdit && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium block mb-3">Banner de Culto (Página de Login)</Label>
              {/* Preview do banner atual */}
              {churchData.bannerUrl && (
                <div className="mb-3 rounded-xl overflow-hidden border relative group">
                  <img
                    src={churchData.bannerUrl}
                    alt="Banner de culto"
                    className="w-full h-32 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              {/* Botões lado a lado */}
              <div className="flex flex-row gap-2">
                <label className="flex-1">
                  <div className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl border border-primary text-primary text-sm font-medium cursor-pointer hover:bg-primary/10 transition-all">
                    {uploadingBanner
                      ? <><div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /><span>Enviando...</span></>
                      : <><ImageIcon className="h-4 w-4" /><span>Trocar Banner</span></>}
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
                        const fileName = optimized instanceof File ? optimized.name : file.name;
                        const { data, error } = await supabase.storage
                          .from('banners')
                          .upload(`${effectiveChurchId}-banner-${Date.now()}-${fileName}`, optimized, {
                            cacheControl: STORAGE_CACHE_CONTROL,
                            contentType: optimized.type || file.type,
                          });
                        if (error) throw error;
                        const { data: { publicUrl } } = supabase.storage
                          .from('banners')
                          .getPublicUrl(data.path);
                        setChurchData({ ...churchData, bannerUrl: publicUrl });
                        toast({ title: 'Banner atualizado!', description: 'Salve as alterações para aplicar.' });
                      } catch (err: any) {
                        toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
                      } finally {
                        setUploadingBanner(false);
                      }
                    }}
                  />
                </label>
                {churchData.bannerUrl && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = churchData.bannerUrl;
                      link.download = `banner-${churchData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                      link.target = '_blank';
                      link.rel = 'noopener noreferrer';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast({ title: 'Download iniciado', description: 'O banner foi enviado para download.' });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Tamanho ideal: 1200x320px (horizontal)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
