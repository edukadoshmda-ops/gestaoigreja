import { useState, useEffect } from 'react';
import {
  Share2,
  Save,
  Loader2,
  ExternalLink,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { churchesService } from '@/services/churches.service';

const NETWORKS = [
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/sua-igreja', icon: Facebook },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/sua_igreja', icon: Instagram },
  { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@sua-igreja', icon: Youtube },
  { key: 'twitter_url', label: 'X (Twitter)', placeholder: 'https://x.com/sua_igreja', icon: Share2 },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '5511999999999 (com DDI, sem +)', icon: MessageCircle },
  { key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@sua_igreja', icon: Share2 },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/sua-igreja', icon: Share2 },
  { key: 'website_url', label: 'Site oficial', placeholder: 'https://suaigreja.com.br', icon: ExternalLink },
] as const;

export default function SocialLinks() {
  useDocumentTitle('Redes Sociais');
  const { churchId, viewingChurch, user } = useAuth();
  const { toast } = useToast();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;

  const canEdit = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'secretario' || user?.role === 'superadmin';

  const [links, setLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (effectiveChurchId) loadChurch();
  }, [effectiveChurchId]);

  async function loadChurch() {
    if (!effectiveChurchId) return;
    setLoading(true);
    try {
      const church = await churchesService.getById(effectiveChurchId);
      const data: Record<string, string> = {};
      NETWORKS.forEach((n) => {
        data[n.key] = (church as any)?.[n.key] || '';
      });
      setLinks(data);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e?.message, variant: 'destructive' });
      setLinks({});
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!effectiveChurchId || !canEdit) return;
    setSaving(true);
    try {
      await churchesService.update(effectiveChurchId, links as any);
      toast({ title: 'Salvo!', description: 'Redes sociais atualizadas.' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function buildUrl(key: string, value: string): string {
    if (key === 'whatsapp' && value) {
      const num = value.replace(/\D/g, '');
      return `https://wa.me/${num}`;
    }
    return value || '#';
  }

  if (!effectiveChurchId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Share2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma igreja</h2>
        <p className="text-muted-foreground">É necessário ter uma igreja vinculada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Redes Sociais da Igreja</h1>
          <p className="text-muted-foreground mt-1">
            Conecte os perfis oficiais da igreja nas principais redes sociais.
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Links das redes
          </CardTitle>
          <CardDescription>
            {canEdit
              ? 'Preencha as URLs dos perfis oficiais. Deixe em branco para ocultar.'
              : 'Redes sociais cadastradas da igreja.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {NETWORKS.map((net) => {
                const Icon = net.icon;
                const value = links[net.key] || '';
                const url = buildUrl(net.key, value);

                return (
                  <div key={net.key} className="space-y-2">
                    <Label htmlFor={net.key} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {net.label}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={net.key}
                        placeholder={net.placeholder}
                        value={value}
                        onChange={(e) => setLinks((prev) => ({ ...prev, [net.key]: e.target.value }))}
                        disabled={!canEdit}
                        className="flex-1"
                      />
                      {value && (
                        <Button
                          variant="outline"
                          size="icon"
                          asChild
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer" title={`Abrir ${net.label}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {!loading && canEdit && (
        <p className="text-sm text-muted-foreground">
          Para WhatsApp, digite o número com DDI (ex: 5511999999999 para Brasil).
        </p>
      )}
    </div>
  );
}
