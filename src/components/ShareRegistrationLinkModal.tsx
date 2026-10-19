import { useState } from 'react';
import { Copy, Check, Share2, ExternalLink, QrCode, MessageCircle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ShareRegistrationLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId?: string | null;
  churchSlug?: string | null;
  churchName?: string;
}

export function ShareRegistrationLinkModal({
  open,
  onOpenChange,
  churchId,
  churchSlug,
  churchName,
}: ShareRegistrationLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const identifier = churchSlug || churchId || 'minha-igreja';
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : import.meta.env.VITE_APP_URL || 'https://church-gest-oficial.vercel.app';

  const registrationUrl = `${baseUrl}/cadastro-membro/${encodeURIComponent(identifier)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(registrationUrl)}`;

  const whatsappMessage = `Olá, a Paz do Senhor! 🙏\n\nEstamos atualizando o cadastro de membros e congregados da *${churchName || 'nossa igreja'}*.\n\nPor favor, preencha sua ficha cadastral pelo link abaixo (leva menos de 2 minutos):\n👉 ${registrationUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'Agora é só colar no grupo de WhatsApp da igreja ou enviar para os membros.',
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: 'Não foi possível copiar automaticamente',
        description: 'Selecione o link no campo abaixo e copie manualmente.',
        variant: 'destructive',
      });
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Share2 className="h-5 w-5 text-primary" />
            Formulário de Cadastro para Membros
          </DialogTitle>
          <DialogDescription>
            Envie este link para os membros da <strong>{churchName || 'sua igreja'}</strong>. Quando
            eles preencherem no celular, os dados cairão automaticamente na sua lista de membros!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Campo do Link + Botão Copiar */}
          <div className="space-y-2">
            <Label htmlFor="public-reg-link" className="text-xs font-bold uppercase text-muted-foreground">
              Link exclusivo da sua igreja
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="public-reg-link"
                value={registrationUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="font-mono text-xs bg-muted/40"
              />
              <Button type="button" onClick={handleCopy} className="shrink-0 gap-1.5">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* Botões de Compartilhamento Rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar pelo WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(registrationUrl, '_blank', 'noopener,noreferrer')}
              className="gap-2 font-semibold"
            >
              <ExternalLink className="h-4 w-4" />
              Visualizar Formulário
            </Button>
          </div>

          {/* QR Code para Telão / Mural */}
          <div className="rounded-xl border bg-muted/20 p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl border shadow-sm shrink-0">
              <img
                src={qrCodeUrl}
                alt="QR Code do formulário de membros"
                className="h-32 w-32 object-contain"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                <QrCode className="h-3.5 w-3.5" />
                QR Code para Culto ou Mural
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Projete este QR Code no telão durante os avisos do culto ou imprima no mural da igreja.
                Os membros só precisam apontar a câmera do celular para preencher a ficha!
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Não exige login nem senha do membro
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
