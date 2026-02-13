import { useState } from 'react';
import { Building2, Upload, Save, Globe, ShieldCheck, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function Institutional() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'secretario';

  const [churchData, setChurchData] = useState({
    name: 'Igreja Comunidade Cristã',
    address: 'Av. Principal, 1000 - Centro',
    phone: '(11) 3333-4444',
    email: 'contato@igreja.com.br',
    about: 'Somos uma igreja comprometida com o evangelho e o amor ao próximo.',
    logoUrl: '',
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareData: true,
    receiveCommunications: true,
    showInDirectory: false,
    acceptedLGPD: true
  });

  const handleSave = () => {
    toast({
      title: 'Configurações salvas!',
      description: 'As informações e preferências de privacidade foram atualizadas.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as informações da igreja e suas preferências de privacidade
          </p>
        </div>
        <Button onClick={handleSave} className="w-full sm:w-auto shadow-md">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Privacidade e LGPD */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-2 bg-primary/20 w-full"></div>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Privacidade e LGPD
            </CardTitle>
            <CardDescription>
              Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-semibold text-primary">Sobre seus Dados Pessoais</p>
                <p className="text-muted-foreground leading-relaxed">
                  Em conformidade com a <strong>LGPD</strong>, informamos que seus dados são coletados exclusivamente para fins de gestão eclesiástica, comunicação de eventos e suporte espiritual. Seus dados estão protegidos em ambiente seguro e <strong>nunca serão vendidos ou compartilhados com terceiros</strong> fora do contexto da igreja sem seu consentimento expresso.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Suas Preferências</p>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <Checkbox
                  id="shareData"
                  checked={privacySettings.shareData}
                  onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, shareData: checked === true })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="shareData" className="text-sm font-medium leading-none cursor-pointer">
                    Compartilhamento de Dados para Gestão
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Autorizo o uso dos meus dados para fins de organização interna, registros de frequência e suporte pastoral.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <Checkbox
                  id="receiveCommunications"
                  checked={privacySettings.receiveCommunications}
                  onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, receiveCommunications: checked === true })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="receiveCommunications" className="text-sm font-medium leading-none cursor-pointer">
                    Comunicações e Notificações
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Desejo receber avisos sobre cultos, eventos, newsletters e mensagens da liderança.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <Checkbox
                  id="showInDirectory"
                  checked={privacySettings.showInDirectory}
                  onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showInDirectory: checked === true })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="showInDirectory" className="text-sm font-medium leading-none cursor-pointer">
                    Visibilidade no Rol de Membros
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Permitir que outros membros ativos vejam meu nome e foto no diretório da igreja.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Church Info (Apenas para Admin/Secretario) */}
        {canEdit && (
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                Informações Institucionais (Igreja)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Igreja</Label>
                  <Input
                    id="name"
                    value={churchData.name}
                    onChange={(e) => setChurchData({ ...churchData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={churchData.phone}
                    onChange={(e) => setChurchData({ ...churchData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={churchData.address}
                    onChange={(e) => setChurchData({ ...churchData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={churchData.email}
                    onChange={(e) => setChurchData({ ...churchData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="about">Sobre a Igreja</Label>
                  <Textarea
                    id="about"
                    value={churchData.about}
                    onChange={(e) => setChurchData({ ...churchData, about: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logo (Apenas para Admin/Secretario) */}
        {canEdit && (
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Logo da Igreja
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {churchData.logoUrl && (
                  <div className="flex justify-center p-4 bg-muted/30 rounded-xl">
                    <img
                      src={churchData.logoUrl}
                      alt="Logo Atual"
                      className="h-32 w-auto object-contain drop-shadow-md"
                    />
                  </div>
                )}

                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-all relative group bg-primary/5 cursor-pointer">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const { data, error } = await supabase.storage
                            .from('church-documents')
                            .upload(`logo/${Date.now()}-${file.name}`, file);

                          if (error) throw error;

                          const { data: { publicUrl } } = supabase.storage
                            .from('church-documents')
                            .getPublicUrl(data.path);

                          setChurchData({ ...churchData, logoUrl: publicUrl });
                          toast({
                            title: 'Logo atualizada!',
                            description: 'A nova logo da igreja foi carregada com sucesso.',
                          });
                        } catch (err: any) {
                          toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
                        }
                      }
                    }}
                  />
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mr-2 mb-4 group-hover:text-primary transition-colors inline-block" />
                  <p className="text-muted-foreground mb-4">
                    Arraste uma imagem ou clique para selecionar a nova logo
                  </p>
                  <Button variant="outline" type="button" className="bg-white">Selecionar Arquivo</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

