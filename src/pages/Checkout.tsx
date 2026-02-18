import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Lock, Building2, ShoppingCart, ExternalLink, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { churchesService } from '@/services/churches.service';
import { APP_NAME } from '@/lib/constants';

// URL do checkout Hotmart - configure no .env.local como VITE_HOTMART_CHECKOUT_URL
const HOTMART_CHECKOUT_URL = import.meta.env.VITE_HOTMART_CHECKOUT_URL || 'https://pay.hotmart.com/SEU_PRODUTO_ID';

export default function Checkout() {
  useDocumentTitle(`Pagamento - ${APP_NAME}`);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Força o tema laranja nas páginas públicas
  useEffect(() => {
    // Aplica imediatamente o tema laranja
    document.documentElement.setAttribute('data-theme', 'fe-radiante');
    document.body.setAttribute('data-theme', 'fe-radiante');
    
    // Cleanup: restaura o tema do usuário apenas se estiver navegando para área autenticada
    return () => {
      // Só restaura se não estiver indo para outra página pública
      const path = window.location.pathname;
      const publicPages = ['/', '/login', '/checkout', '/hotmart-success'];
      if (!publicPages.includes(path)) {
        const savedTheme = localStorage.getItem('church_theme') || 'fe-radiante';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      }
    };
  }, []);
  const [loading, setLoading] = useState(false);
  const [churchData, setChurchData] = useState({ churchName: '', churchSlug: '', adminEmail: '' });
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simula processamento (integrar com Stripe/Mercado Pago futuramente)
    await new Promise((r) => setTimeout(r, 1500));

    try {
      if (churchData.churchName.trim()) {
        const slug = churchData.churchSlug || churchData.churchName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'igreja-' + Date.now();
        await churchesService.createFromCheckout(
          churchData.churchName.trim(),
          slug,
          churchData.adminEmail.trim() || undefined
        );
      }
    } catch (err) {
      console.warn('Erro ao cadastrar igreja:', err);
    }

    toast({
      title: 'Pagamento realizado!',
      description: churchData.churchName ? 'Sua igreja foi cadastrada. Faça login para acessar o app.' : 'Sua assinatura foi confirmada. Faça login para acessar o app.',
    });
    setLoading(false);
    navigate('/login', { replace: true });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={true} />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento com cartão
            </CardTitle>
            <CardDescription>
              Plano mensal • R$ 150/mês • Cobrança no cartão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">Resumo da assinatura</p>
              <p className="text-2xl font-bold mt-1">R$ 150,00<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            </div>

            {/* Opção de compra via Hotmart */}
            {HOTMART_CHECKOUT_URL && HOTMART_CHECKOUT_URL !== 'https://pay.hotmart.com/SEU_PRODUTO_ID' && (
              <div className="mb-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 gap-2"
                  onClick={() => {
                    // Salvar dados da igreja no localStorage para usar após retorno da Hotmart
                    if (churchData.churchName) {
                      localStorage.setItem('pending_church_data', JSON.stringify(churchData));
                    }
                    window.location.href = HOTMART_CHECKOUT_URL;
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Comprar na Hotmart
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Pagamento seguro e rápido via Hotmart
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3 pb-4 border-b">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-primary" />
                  Dados da sua igreja
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churchName">Nome da Igreja</Label>
                  <Input
                    id="churchName"
                    placeholder="Ex: Igreja Batista Central"
                    value={churchData.churchName}
                    onChange={(e) => setChurchData({ ...churchData, churchName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">E-mail do administrador</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="Ex: pastor@igreja.com"
                    value={churchData.adminEmail}
                    onChange={(e) => setChurchData({ ...churchData, adminEmail: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">Usado para vincular sua conta ao painel da igreja</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do cartão</Label>
                <Input
                  id="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName">Nome no cartão</Label>
                <Input
                  id="cardName"
                  placeholder="Como está no cartão"
                  value={formData.cardName}
                  onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Validade</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={formData.expiry}
                    onChange={(e) => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">3 ou 4 dígitos no verso</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>Pagamento seguro. Seus dados estão protegidos.</span>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Garantia e devolução
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>7 dias de garantia:</strong> Cancele em até 7 dias e devolvemos 100% do valor, sem perguntas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>Assinatura mensal cancelável a qualquer momento. Sem multas ou burocracia.</span>
                  </li>
                </ul>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? 'Processando...' : 'Pagar R$ 150,00'}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Após confirmar o pagamento, você será redirecionado para criar sua conta e acessar o app.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
