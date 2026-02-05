import { useState } from 'react';
import { Building2, Upload, Save, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sidebar } from '@/components/Sidebar';
import { useToast } from '@/hooks/use-toast';

export default function Institutional() {
  const { toast } = useToast();
  const [churchData, setChurchData] = useState({
    name: 'Igreja Comunidade Cristã',
    address: 'Av. Principal, 1000 - Centro',
    phone: '(11) 3333-4444',
    email: 'contato@igreja.com.br',
    about: 'Somos uma igreja comprometida com o evangelho e o amor ao próximo.',
    youtube: 'https://youtube.com/@igreja',
    facebook: 'https://facebook.com/igreja',
    instagram: 'https://instagram.com/igreja',
    whatsapp: '5511999999999',
  });

  const handleSave = () => {
    toast({
      title: 'Dados salvos!',
      description: 'As informações institucionais foram atualizadas.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institucional</h1>
          <p className="text-muted-foreground">
            Configure as informações da igreja
          </p>
        </div>
        <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Church Info */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Igreja
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

        {/* Social Media */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={churchData.youtube}
                  onChange={(e) => setChurchData({ ...churchData, youtube: e.target.value })}
                  placeholder="https://youtube.com/@seucanal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={churchData.facebook}
                  onChange={(e) => setChurchData({ ...churchData, facebook: e.target.value })}
                  placeholder="https://facebook.com/suapagina"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={churchData.instagram}
                  onChange={(e) => setChurchData({ ...churchData, instagram: e.target.value })}
                  placeholder="https://instagram.com/seuperfil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={churchData.whatsapp}
                  onChange={(e) => setChurchData({ ...churchData, whatsapp: e.target.value })}
                  placeholder="5511999999999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo da Igreja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Arraste uma imagem ou clique para selecionar
              </p>
              <Button variant="outline">Selecionar Arquivo</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
