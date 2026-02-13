import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Users, Briefcase, ArrowRight, Cross, MapPin, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import heroImage from '@/assets/sky-landscape.png';

type Step = 1 | 2;

interface FormData {
    fullName: string;
    email: string;
    role: UserRole;
    pin: string[];
}

export default function NewLogin() {
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        role: 'membro',
        pin: ['', '', '', '', '', ''],
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleWelcomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.fullName || !formData.email) {
            setError('Por favor, preencha todos os campos');
            return;
        }
        // Removida validação de email para facilitar acesso
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

            console.log('Iniciando login para:', formData.email, 'com PIN de', pinString.length, 'digitos');

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

    return (
        <div className="min-h-screen flex items-center justify-center relative px-4 py-12 bg-background">
            {/* Background Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img
                    src={heroImage}
                    alt="Céu"
                    className="w-full h-full object-cover opacity-10"
                />
                <div className="absolute inset-0 bg-background" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* TELA 1: BOAS-VINDAS */}
                {step === 1 && (
                    <Card className="shadow-2xl border-primary/10 overflow-hidden">
                        <CardContent className="p-8">
                            <div className="text-center mb-10">
                                <div className="flex justify-center mb-6">
                                    <Logo size="xl" showText={false} />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">
                                    Gestão Church
                                </h1>
                                <div className="h-1.5 w-20 bg-primary mx-auto rounded-full mb-8 shadow-sm"
                                    style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                                <h2 className="text-xl font-bold text-foreground/80">Bem-vindo</h2>
                            </div>

                            <form onSubmit={handleWelcomeSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
                                        Nome Completo
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Digite seu nome"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="h-12 bg-muted/30 border-primary/10 focus:border-primary/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
                                        E-mail
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 bg-muted/30 border-primary/10 focus:border-primary/50"
                                        required
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive text-center font-medium bg-destructive/10 py-2 rounded-md border border-destructive/20">
                                        {error}
                                    </p>
                                )}

                                <Button type="submit" className="w-full h-14 text-base font-bold" size="lg">
                                    Continuar
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* TELA 2: LOGIN/CADASTRO */}
                {step === 2 && (
                    <Card className="shadow-2xl border-primary/10 overflow-hidden">
                        <CardContent className="p-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-foreground mb-1">Acesso Seguro</h2>
                                <p className="text-sm text-muted-foreground">Escolha seu perfil e digite seu PIN</p>
                            </div>

                            <form onSubmit={handleFinalSubmit} className="space-y-8">
                                {/* PIN Container */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-foreground/70 text-center block uppercase tracking-widest">
                                        Sua Senha PIN (6 dígitos)
                                    </label>
                                    <div className="flex justify-between gap-2 max-w-[280px] mx-auto">
                                        {formData.pin.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => (pinRefs.current[i] = el)}
                                                type="password"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handlePinChange(i, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(i, e)}
                                                className="w-10 h-12 text-center text-xl font-bold bg-muted/40 border-2 border-primary/10 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Seleção de Perfil */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-foreground/70 block uppercase tracking-widest mb-4">
                                        Selecione seu Perfil
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <RoleCard
                                            icon={<Shield className="h-5 w-5" />}
                                            label="Pastor"
                                            active={formData.role === 'admin'}
                                            onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        />
                                        <RoleCard
                                            icon={<User className="h-5 w-5" />}
                                            label="Secretário"
                                            active={formData.role === 'secretario'}
                                            onClick={() => setFormData({ ...formData, role: 'secretario' })}
                                        />
                                        <RoleCard
                                            icon={<Briefcase className="h-5 w-5" />}
                                            label="Tesoureiro"
                                            active={formData.role === 'tesoureiro'}
                                            onClick={() => setFormData({ ...formData, role: 'tesoureiro' })}
                                        />
                                        <RoleCard
                                            icon={<MapPin className="h-5 w-5" />}
                                            label="Líder Célula"
                                            active={formData.role === 'lider_celula'}
                                            onClick={() => setFormData({ ...formData, role: 'lider_celula' })}
                                        />
                                        <RoleCard
                                            icon={<Church className="h-5 w-5" />}
                                            label="Líder Minis."
                                            active={formData.role === 'lider_ministerio'}
                                            onClick={() => setFormData({ ...formData, role: 'lider_ministerio' })}
                                        />
                                        <RoleCard
                                            icon={<Users className="h-5 w-5" />}
                                            label="Membro"
                                            active={formData.role === 'membro'}
                                            onClick={() => setFormData({ ...formData, role: 'membro' })}
                                        />
                                        <RoleCard
                                            icon={<Shield className="h-5 w-5" />}
                                            label="SuperAdmin"
                                            active={formData.role === 'superadmin'}
                                            onClick={() => setFormData({ ...formData, role: 'superadmin' })}
                                        />
                                        <RoleCard
                                            icon={<User className="h-5 w-5" />}
                                            label="Congregado"
                                            active={formData.role === 'congregado'}
                                            onClick={() => setFormData({ ...formData, role: 'congregado' })}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive text-center font-medium bg-destructive/10 py-2 rounded-md border border-destructive/20">
                                        {error}
                                    </p>
                                )}

                                <div className="flex flex-col gap-3">
                                    <Button
                                        type="submit"
                                        className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20"
                                        size="lg"
                                        disabled={formData.pin.some(digit => !digit)}
                                    >
                                        Entrar no Sistema
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors font-semibold"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function RoleCard({
    icon,
    label,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-4 gap-2 rounded-xl border-2 transition-all duration-300
                ${active
                    ? 'border-primary bg-primary/10 text-primary shadow-md scale-105'
                    : 'border-muted/50 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground font-medium'
                }`}
        >
            <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}

