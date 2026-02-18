import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ResetPassword() {
    useDocumentTitle('Nova senha');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState<boolean | null>(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        authService.getSession().then(({ data }) => {
            setReady(!!data?.session);
        }).catch(() => setReady(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast({ title: 'A senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
            return;
        }
        if (password !== confirm) {
            toast({ title: 'As senhas não coincidem', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await authService.updatePassword(password);
            toast({ title: 'Senha alterada com sucesso. Faça login com a nova senha.' });
            navigate('/login', { replace: true });
        } catch (err: any) {
            toast({
                title: 'Erro ao alterar senha',
                description: err?.message || 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (ready === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-background">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <h1 className="text-xl font-bold mb-2">Link inválido ou expirado</h1>
                        <p className="text-muted-foreground mb-4">
                            Solicite um novo link de redefinição de senha na tela de login.
                        </p>
                        <Button onClick={() => navigate('/login', { replace: true })}>
                            Ir para o login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-background">
            <Card className="w-full max-w-md shadow-xl">
                <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                        <Logo size="sm" showText={false} />
                    </div>
                    <h1 className="text-xl font-bold text-center mb-1">Nova senha</h1>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                        Digite e confirme sua nova senha (mínimo 6 caracteres).
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-foreground/80 block mb-1.5">Nova senha</label>
                            <Input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-foreground/80 block mb-1.5">Confirmar senha</label>
                            <Input
                                type="password"
                                placeholder="Repita a senha"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                minLength={6}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Salvando...' : 'Alterar senha'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
