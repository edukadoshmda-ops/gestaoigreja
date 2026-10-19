import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Shield, User, Users, Briefcase, MapPin, Church, Mail, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { authService } from '@/services/auth.service';
import { UNRESTRICTED_EMAILS } from '@/lib/constants';
import { testSupabaseConnection } from '@/lib/supabaseClient';
import { z } from 'zod';

import { useTenant } from '@/hooks/useTenant';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
type Step = 1 | 2;

const step1Schema = z.object({
    fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120, 'Nome muito longo'),
    email: z.string().min(1, 'E-mail é obrigatório').email('Informe um e-mail válido'),
});

const forgotSchema = z.object({
    email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
});

interface FormData {
    fullName: string;
    email: string;
    role: UserRole;
    pin: string[];
}

export default function NewLogin() {
    useDocumentTitle('Login');

    const { tenant } = useTenant();

    // Força o tema oceano nas páginas públicas
    useEffect(() => {
        // Aplica imediatamente o tema
        document.documentElement.setAttribute('data-theme', 'ceu-azul');
        document.body.setAttribute('data-theme', 'ceu-azul');

        // Se ?trial=1, marcar para signup trial
        const params = new URLSearchParams(window.location.search);
        if (params.get('trial') === '1') {
            try { sessionStorage.setItem('trial_signup', '1'); } catch {}
        }

        // Cleanup: restaura o tema do usuário apenas se estiver navegando para área autenticada
        return () => {
            // Só restaura se não estiver indo para outra página pública
            const path = window.location.pathname;
            const publicPages = ['/', '/login', '/checkout', '/hotmart-success'];
            if (!publicPages.includes(path)) {
                const savedTheme = localStorage.getItem('church_theme_v2') || 'ceu-azul';
                document.documentElement.setAttribute('data-theme', savedTheme);
                document.body.setAttribute('data-theme', savedTheme);
            }
        };
    }, []);

    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        role: 'membro',
        pin: ['', '', '', '', '', ''],
    });
    const [error, setError] = useState('');
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [connectionTestOpen, setConnectionTestOpen] = useState(false);
    const [connectionTestResult, setConnectionTestResult] = useState<{ urlConfigured: boolean; keyConfigured: boolean; ok: boolean; error?: string } | null>(null);
    const [connectionTestLoading, setConnectionTestLoading] = useState(false);
    const { login } = useAuth();
    const { toast } = useToast();
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleWelcomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const result = step1Schema.safeParse({ fullName: formData.fullName.trim(), email: formData.email.trim() });
        if (!result.success) {
            const msg = result.error.errors.map(e => e.message).join('. ');
            setError(msg);
            return;
        }
        // E-mail sem restrição: pré-seleciona SuperAdmin (acesso interno)
        const email = formData.email.trim().toLowerCase();
        if (UNRESTRICTED_EMAILS.some(e => e.trim().toLowerCase() === email)) {
            setFormData(f => ({ ...f, role: 'superadmin' }));
        } else {
            // Novos cadastros públicos: sempre Membro
            setFormData(f => ({ ...f, role: 'membro' }));
        }
        setStep(2);
    };

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...formData.pin];
        newPin[index] = value.slice(-1);
        setFormData({ ...formData, pin: newPin });

        // Move to next input
        if (value && index < 5) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !formData.pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const pinString = formData.pin.join('');

            if (pinString.length < 6) {
                setError('O PIN deve ter exatamente 6 dígitos.');
                return;
            }

            // A função login agora é assíncrona e realiza a autenticação real no Supabase
            const success = await login(formData.email, pinString, formData.role, formData.fullName);

            if (success) {
                // O App.tsx cuidará do redirecionamento ao detectar que o user não é mais null
            } else {
                setError('E-mail ou PIN incorretos.');
            }
        } catch (err: any) {
            console.error('Erro no login:', err);
            setError(err.message || 'Ocorreu um erro ao tentar entrar. Tente novamente.');
        }
    };

    const handleConnectionTest = async () => {
        setConnectionTestLoading(true);
        setConnectionTestResult(null);
        setConnectionTestOpen(true);
        try {
            const r = await testSupabaseConnection();
            setConnectionTestResult(r);
        } catch {
            setConnectionTestResult({ urlConfigured: false, keyConfigured: false, ok: false, error: 'Erro ao testar.' });
        } finally {
            setConnectionTestLoading(false);
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = forgotSchema.safeParse({ email: forgotEmail.trim() });
        if (!result.success) {
            const msg = result.error.errors.map(e => e.message).join('. ');
            toast({ title: msg, variant: 'destructive' });
            return;
        }
        const email = result.data.email;
        setForgotLoading(true);
        try {
            await authService.resetPassword(email);
            toast({
                title: 'E-mail enviado',
                description: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a pasta de spam.',
            });
            setForgotOpen(false);
            setForgotEmail('');
        } catch (err: any) {
            toast({
                title: 'Erro ao enviar',
                description: err?.message || 'Não foi possível enviar o e-mail. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative px-4 bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-50/50 overflow-hidden">
            {/* EFEITOS DE BRILHO E TRANSPARÊNCIA GLASSMORPHISM */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                {/* Orbs coloridos para dar profundidade visível à transparência do vidro */}
                <div className="absolute top-[-5%] left-[-5%] w-[550px] h-[550px] bg-blue-300/30 rounded-full blur-[110px] mix-blend-multiply animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-300/30 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute w-[450px] h-[450px] bg-indigo-200/25 rounded-full blur-[90px] mix-blend-multiply" />

                {/* SVG Pattern de pontinhos visível através do vidro */}
                <svg className="absolute inset-0 w-full h-full opacity-35 z-0" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="brilho" width="48" height="48" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="#3b82f6" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#brilho)" />
                </svg>
            </div>
            <div className="w-full max-w-[396px] relative z-10 scale-[0.85] origin-center">
                {/* TELA 1: BOAS-VINDAS */}
                {step === 1 && (
                    <Card className="shadow-[0_20px_50px_rgba(30,58,138,0.08),0_0_0_1px_rgba(255,255,255,0.7)] border-white/70 bg-white/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden transition-all">
                        {/* PARTE SUPERIOR (TRANSLÚCIDA / VIDRO) */}
                        <div className="p-4 pb-3 text-center space-y-4">
                            {/* Logo */}
                            <div className="flex flex-col items-center justify-center group">
                                <Logo size="md" showText={false} />
                            </div>

                            {/* Banner de Culto - Espaço para imagem dinâmica */}
                            <div className="relative w-full h-48 bg-slate-100/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 group flex items-center justify-center">
                                {/* Imagem do Banner */}
                                <img 
                                    src={tenant?.banner_url || '/banner-superadmin.jpg'} 
                                    alt="Banner de Culto" 
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/banner-superadmin.jpg';
                                    }}
                                />
                            </div>

                            {/* Nome da igreja */}
                            {tenant?.name && (
                                <h1 className="text-xl font-bold">
                                    <span className="text-slate-900">{tenant.name}</span>
                                </h1>
                            )}

                            {/* Mensagens de boas-vindas */}
                            <div className="space-y-0.5">
                                <p className="text-lg font-bold text-primary">Seja bem Vindo</p>
                                <h2 className="text-sm font-semibold">Acessar sistema</h2>
                                <p className="text-[10px] text-muted-foreground mt-1">Entre com seus dados para continuar</p>
                            </div>
                        </div>

                        {/* PARTE DE BAIXO (BRANCO MAIS SÓLIDO COM CONTRASTE) */}
                        <div className="bg-white/85 backdrop-blur-xl border-t border-slate-100/90 p-4 pt-3.5 shadow-sm">
                            <form onSubmit={handleWelcomeSubmit} className="space-y-3">
                                <div>
                                    <Input
                                        type="text"
                                        placeholder="Seu Nome"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="h-11 text-sm rounded-2xl bg-[#EEF5FC]/80 backdrop-blur-md border border-[#C8DCF2] focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 shadow-[0_2px_8px_rgba(59,130,246,0.06)] text-slate-800 transition-all placeholder:text-slate-400 px-4"
                                        required
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="email"
                                        placeholder="E-mail"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-11 text-sm rounded-2xl bg-[#EEF5FC]/80 backdrop-blur-md border border-[#C8DCF2] focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 shadow-[0_2px_8px_rgba(59,130,246,0.06)] text-slate-800 transition-all placeholder:text-slate-400 px-4"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-xs text-destructive text-center">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-11 text-sm font-semibold rounded-2xl shadow-md shadow-primary/25 hover:shadow-lg transition-all" size="default">
                                    Próximo
                                </Button>
                                
                                <div className="flex flex-col items-center gap-1.5 pt-2">
                                    <a
                                        href="/vendas"
                                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-700 hover:bg-amber-500/25 font-bold text-xs text-center transition-all"
                                    >
                                        🔥 Ver Página de Vendas e Super Oferta
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => { setForgotEmail(formData.email); setForgotOpen(true); }}
                                        className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        Esqueci minha senha
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConnectionTest}
                                        disabled={connectionTestLoading}
                                        className="text-[9px] text-muted-foreground/50 hover:text-primary transition-colors uppercase"
                                    >
                                        {connectionTestLoading ? 'Verificando...' : 'Status da Conexão'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="shadow-[0_20px_50px_rgba(30,58,138,0.08),0_0_0_1px_rgba(255,255,255,0.7)] border-white/70 bg-white/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden transition-all">
                        {/* PARTE SUPERIOR (TRANSLÚCIDA / VIDRO) */}
                        <div className="p-4 pb-3 text-center">
                            <div className="flex justify-center mb-3">
                                <Logo size="md" showText={false} />
                            </div>
                            <p className="text-xl font-bold text-primary">Quase lá!</p>
                            <h2 className="text-base font-semibold">Como você participa?</h2>
                            <p className="text-xs text-muted-foreground">Escolha seu perfil e informe sua senha</p>
                        </div>

                        {/* PARTE DE BAIXO (BRANCO MAIS SÓLIDO COM CONTRASTE) */}
                        <div className="bg-white/85 backdrop-blur-xl border-t border-slate-100/90 p-4 pt-3.5 shadow-sm">
                            <form onSubmit={handleFinalSubmit} className="space-y-4">
                                {/* Membro ou Congregado podem se auto-cadastrar */}
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground text-center">
                                        Selecione como você participa da igreja.
                                        Líderes e pastores acessam com e-mail e senha fornecidos pela liderança.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: 'membro' })}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all border-2 ${
                                                formData.role === 'membro'
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                                                    : 'bg-[#EDF3FA]/80 text-muted-foreground border-[#D6E3F2] hover:border-primary/50 hover:bg-white'
                                            }`}
                                        >
                                            <Users size={16} />
                                            Membro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: 'congregado' })}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all border-2 ${
                                                formData.role === 'congregado'
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                                                    : 'bg-[#EDF3FA]/80 text-muted-foreground border-[#D6E3F2] hover:border-primary/50 hover:bg-white'
                                            }`}
                                        >
                                            <User size={16} />
                                            Congregado
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-medium text-muted-foreground">PIN de 6 dígitos</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {formData.pin.map((digit, index) => (
                                            <Input
                                                key={index}
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handlePinChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                ref={(el) => (pinRefs.current[index] = el)}
                                                className="h-12 rounded-2xl text-center text-lg font-semibold bg-[#EDF3FA]/80 border-[#D6E3F2] focus:bg-white focus:border-primary shadow-inner text-slate-800 transition-all"
                                                required
                                            />
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-sm text-destructive text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <Button
                                        type="submit"
                                        className="w-full h-11 text-sm font-semibold rounded-2xl shadow-md shadow-primary/25 hover:shadow-lg transition-all"
                                        size="default"
                                        disabled={formData.pin.some(digit => !digit)}
                                    >
                                        Entrar
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Card>
                )}
            </div>

            {/* Diálogos */}
            <Dialog open={connectionTestOpen} onOpenChange={setConnectionTestOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Diagnóstico</DialogTitle>
                        <DialogDescription>
                            Verificação de conexão com o servidor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        {connectionTestLoading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Testando...</p>
                        ) : connectionTestResult ? (
                            <div className="space-y-2">
                                <StatusItem label="URL do Banco" ok={connectionTestResult.urlConfigured} />
                                <StatusItem label="Chave de API" ok={connectionTestResult.keyConfigured} />
                                <StatusItem label="Status Final" ok={connectionTestResult.ok} error={connectionTestResult.error} />
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Recuperar Senha</DialogTitle>
                        <DialogDescription>
                            Enviaremos um link para o seu e-mail.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
                        <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                        />
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={forgotLoading}>
                                {forgotLoading ? 'Enviando...' : 'Enviar Link'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatusItem({ label, ok, error }: { label: string; ok: boolean; error?: string }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-xl bg-muted/50 border">
            <span className="text-xs font-medium">{label}</span>
            {ok ? (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">OK</span>
            ) : (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">{error || 'ERRO'}</span>
            )}
        </div>
    );
}

function RoleButton({
    icon,
    label,
    active,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-start gap-3 rounded-2xl border px-4 py-2.5 text-sm transition w-full ${
                active
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-muted hover:bg-muted text-muted-foreground'
            }`}
        >
            <span className={active ? 'text-primary' : 'text-muted-foreground opacity-70'}>
                {icon}
            </span>
            <span>{label}</span>
        </button>
    );
}






