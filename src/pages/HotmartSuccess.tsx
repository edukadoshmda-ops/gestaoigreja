import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { APP_NAME } from '@/lib/constants';

export default function HotmartSuccess() {
  useDocumentTitle(`Compra Confirmada - ${APP_NAME}`);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const transaction = searchParams.get('transaction');
  const email = searchParams.get('email');
  const name = searchParams.get('name');

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

  useEffect(() => {
    // Simular processamento do webhook
    // Na prática, o webhook já terá processado a compra
    if (transaction) {
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 2000);
    } else {
      navigate('/');
    }
  }, [transaction, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <h2 className="text-xl font-bold">Processando sua compra...</h2>
                <p className="text-muted-foreground mt-2">
                  Aguarde enquanto configuramos sua conta no sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={true} />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Compra Confirmada!
          </CardTitle>
          <CardDescription className="text-base">
            Sua assinatura foi ativada com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">E-mail cadastrado:</p>
              <p className="font-semibold">{email}</p>
            </div>
          )}
          
          {transaction && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Número da transação:</p>
              <p className="font-mono text-sm">{transaction}</p>
            </div>
          )}

          <div className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Sua igreja foi cadastrada no sistema. Faça login com seu e-mail para acessar o painel.
            </p>
            <Button 
              onClick={() => navigate('/login', { 
                state: { 
                  email,
                  message: 'Compra confirmada! Faça login para acessar o app.'
                } 
              })}
              className="w-full"
              size="lg"
            >
              Ir para Login
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar para Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
