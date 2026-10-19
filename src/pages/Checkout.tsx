import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Church, User, Mail, CreditCard, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Globe, AlertCircle, Zap, Star, Crown, Building2, Check, Lock, Eye, EyeOff } from 'lucide-react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const PLAN_FEATURES = [
  'Gestão completa de membros',
  'Controle financeiro',
  'Células e ministérios',
  'Relatórios avançados',
  'Boletins e avisos',
  'Suporte prioritário',
  'Cancele quando quiser',
];

const PLANS = [
  {
    id: 'super-oferta',
    icon: CreditCard,
    name: 'Super Oferta Limitada',
    memberRange: '1º ano 12x R$ 150 • 2º ano 12x R$ 125 • 3º ano+ 12x R$ 100 (Cartão)',
    price: 150,
    color: 'from-amber-500 via-orange-500 to-rose-600',
    borderSelected: 'border-amber-500 ring-2 ring-amber-500/30',
    borderDefault: 'border-amber-500/40',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgSelected: 'bg-amber-50 dark:bg-amber-950/30',
    features: [
      '1º Ano: 12x de R$ 150 no Cartão de Crédito',
      '2º Ano: 12x de R$ 125 no Cartão de Crédito',
      '3º Ano em diante: 12x de R$ 100 no Cartão de Crédito',
      ...PLAN_FEATURES,
    ],
    popular: true,
    badgeLabel: '🔥 Super Oferta',
  },
  {
    id: 'starter',
    icon: Zap,
    name: 'Starter',
    memberRange: 'Até 100 membros',
    price: 199,
    color: 'from-emerald-500 to-teal-600',
    borderSelected: 'border-emerald-500 ring-2 ring-emerald-500/30',
    borderDefault: 'border-border',
    textColor: 'text-emerald-600',
    bgSelected: 'bg-emerald-50 dark:bg-emerald-950/30',
    features: PLAN_FEATURES,
  },
  {
    id: 'growth',
    icon: Star,
    name: 'Growth',
    memberRange: '100 a 500 membros',
    price: 299,
    color: 'from-blue-500 to-indigo-600',
    borderSelected: 'border-blue-500 ring-2 ring-blue-500/30',
    borderDefault: 'border-border',
    textColor: 'text-blue-600',
    bgSelected: 'bg-blue-50 dark:bg-blue-950/30',
    features: PLAN_FEATURES,
  },
  {
    id: 'professional',
    icon: Crown,
    name: 'Professional',
    memberRange: '500 a 2.000 membros',
    price: 499,
    color: 'from-purple-500 to-violet-600',
    borderSelected: 'border-purple-500 ring-2 ring-purple-500/30',
    borderDefault: 'border-border',
    textColor: 'text-purple-600',
    bgSelected: 'bg-purple-50 dark:bg-purple-950/30',
    features: PLAN_FEATURES,
  },
  {
    id: 'enterprise',
    icon: Building2,
    name: 'Enterprise',
    memberRange: 'Mais de 2.000 membros',
    price: 1200,
    color: 'from-orange-500 to-red-600',
    borderSelected: 'border-orange-500 ring-2 ring-orange-500/30',
    borderDefault: 'border-border',
    textColor: 'text-orange-600',
    bgSelected: 'bg-orange-50 dark:bg-orange-950/30',
    features: PLAN_FEATURES,
  },
];

export default function Checkout() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showFallback, setShowFallback] = useState(false);

    // Seleciona plano da URL ou Super Oferta por padrão
    const planFromUrl = searchParams.get('plan') || 'super-oferta';
    const [selectedPlanId, setSelectedPlanId] = useState(
        PLANS.find(p => p.id === planFromUrl) ? planFromUrl : 'super-oferta'
    );
    const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[0];

    const [formData, setFormData] = useState({
        churchName: '',
        churchSlug: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        cpfCnpj: '',
        mobilePhone: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    
    useEffect(() => {
        const stored = sessionStorage.getItem('trial_church_form_data');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setFormData(prev => ({
                    ...prev,
                    churchName: data.name || prev.churchName,
                    churchSlug: data.slug || prev.churchSlug,
                    adminEmail: data.email || prev.adminEmail,
                    adminName: data.pastorName || prev.adminName,
                    cpfCnpj: data.cnpj || prev.cpfCnpj,
                    mobilePhone: data.whatsapp || data.phone || prev.mobilePhone
                }));
            } catch (e) {
                console.error('Erro ao carregar dados do trial:', e);
            }
        }
    }, []);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        setFormData({ ...formData, churchSlug: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.adminPassword.length < 6) {
            toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
            return;
        }
        setLoading(true);

        try {
            // Cria a conta do administrador no Supabase Auth
            const { error: authError } = await supabase.auth.signUp({
                email: formData.adminEmail.trim(),
                password: formData.adminPassword,
                options: {
                    data: {
                        full_name: formData.adminName || 'Administrador',
                        role: 'pastor',
                    }
                }
            });
            if (authError && !authError.message.includes('already registered')) {
                throw authError;
            }
            const { data, error } = await supabase.functions.invoke('asaas-integration', {
                body: { 
                    action: 'init_checkout', 
                    ...formData,
                    subscription_plan: selectedPlanId === 'super-oferta' ? 'starter' : selectedPlanId,
                    plan_amount: selectedPlan.price,
                }
            });

            if (error) throw error;

            if (data?.url) {
                toast({
                    title: 'Iniciando pagamento',
                    description: 'Você será redirecionado para o ambiente de pagamento.',
                });
                setTimeout(() => {
                    window.location.href = data.url;
                }, 1500);
            } else {
                throw new Error('Falha ao gerar link de pagamento.');
            }
        } catch (error: any) {
            console.error('Erro no checkout:', error);
            
            let errorMessage = error.message || 'Ocorreu um erro ao processar sua solicitação.';
            
            if (error.context) {
                try {
                    const contextClone = error.context.clone ? error.context.clone() : error.context;
                    const body = await contextClone.json();
                    if (body?.error) {
                        errorMessage = body.error;
                    }
                } catch (e) {
                    console.error('Erro ao ler JSON de erro do context:', e);
                }
            }

            if (error.message?.includes('non-2xx') || error.name === 'FunctionsHttpError') {
                toast({
                    title: 'Falha na validação',
                    description: errorMessage || 'Houve um erro na validação dos dados.',
                    variant: 'destructive'
                });
                return;
            }
 
            const isNetworkError = error.message?.includes('failed to fetch');
            
            if (isNetworkError) {
                setShowFallback(true);
            } else {
                toast({
                    title: 'Erro no cadastro',
                    description: errorMessage,
                    variant: 'destructive'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTrialFallback = () => {
        try {
            const trialData = {
                name: formData.churchName,
                slug: formData.churchSlug,
                email: formData.adminEmail,
                pastorName: formData.adminName,
            };
            sessionStorage.setItem('trial_church_form_data', JSON.stringify(trialData));
            sessionStorage.setItem('trial_signup', '1');
            
            toast({
                title: 'Modo de Teste Ativado',
                description: 'A integração financeira está offline. Redirecionando para o teste gratuito de 7 dias...',
            });
            
            setTimeout(() => {
                navigate('/login?trial=1');
            }, 2000);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12 px-4 overflow-x-hidden w-full">
            <div className="mb-8 scale-90">
                <Logo size="lg" />
            </div>

            <div className="max-w-5xl w-full space-y-8">

                {/* Seleção de Planos */}
                <div>
                    <h2 className="text-2xl font-black text-center mb-2">Escolha seu Plano</h2>
                    <p className="text-muted-foreground text-center text-sm mb-6">Selecione conforme o número de membros da sua igreja</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pb-4">
                        {PLANS.map(plan => {
                            const Icon = plan.icon;
                            const isSelected = selectedPlanId === plan.id;
                            return (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={cn(
                                        'relative rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md w-full',
                                        isSelected ? `${plan.borderSelected} ${plan.bgSelected}` : `${plan.borderDefault} bg-background hover:border-muted-foreground/30`
                                    )}
                                >
                                    {plan.popular && (
                                        <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                            {(plan as any).badgeLabel || 'Popular'}
                                        </span>
                                     )}
                                    <div className={cn('p-2 rounded-xl w-fit mb-2 bg-gradient-to-br text-white', plan.color)}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <p className={cn('text-xs font-black uppercase tracking-wide', isSelected ? plan.textColor : 'text-muted-foreground')}>
                                        {plan.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{plan.memberRange}</p>
                                    <p className={cn('text-lg font-black mt-1', isSelected ? 'text-foreground' : 'text-foreground/70')}>
                                        R$ {plan.price.toLocaleString('pt-BR')}
                                        <span className="text-xs font-normal text-muted-foreground">/mês</span>
                                    </p>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 className={cn('h-5 w-5', plan.textColor)} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid md:grid-cols-5 gap-8">
                    {/* Resumo do Plano Selecionado */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className={cn('border-2 shadow-xl overflow-hidden transition-all', selectedPlan.borderSelected.split(' ')[0])}>
                            <div className={cn('bg-gradient-to-r p-4 text-white text-center font-black', selectedPlan.color)}>
                                PLANO {selectedPlan.name.toUpperCase()}
                            </div>
                            <CardHeader>
                                <CardTitle className="text-3xl font-black">
                                    R$ {selectedPlan.price.toLocaleString('pt-BR')}
                                    <span className="text-sm font-normal text-muted-foreground ml-1">/mês</span>
                                </CardTitle>
                                <CardDescription>{selectedPlan.memberRange}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {selectedPlan.features.map(f => (
                                    <div key={f} className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className={cn('h-4 w-4 shrink-0', selectedPlan.textColor)} />
                                        <span>{f}</span>
                                    </div>
                                ))}

                            </CardContent>
                            <CardFooter className="bg-muted/50 p-4 border-t">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    Pagamento seguro via Asaas
                                </div>
                            </CardFooter>
                        </Card>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                            <h4 className="font-bold flex items-center gap-2 text-primary">
                                <CheckCircle2 className="h-5 w-5" /> Ativação Automática
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Assim que o pagamento for confirmado, você receberá um e-mail com suas credenciais e sua igreja será criada instantaneamente.
                            </p>
                        </div>
                    </div>

                    {/* Formulário de Cadastro */}
                    <Card className="md:col-span-3 shadow-2xl border-none">
                        <CardHeader>
                            <CardTitle>Dados da Igreja</CardTitle>
                            <CardDescription>Preencha as informações para criar sua conta.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Church className="h-4 w-4 text-muted-foreground" /> Nome da Igreja
                                        </label>
                                        <Input 
                                            placeholder="Ex: Igreja Batista Renovada" 
                                            required 
                                            value={formData.churchName}
                                            onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-muted-foreground" /> URL da sua Igreja (Slug)
                                        </label>
                                        <div className="flex items-center group">
                                            <div className="bg-muted px-2 sm:px-3 py-2 border border-r-0 rounded-l-md text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                                app.gestaoigreja.com/
                                            </div>
                                            <Input 
                                                placeholder="nome-da-igreja" 
                                                className="rounded-l-none" 
                                                required 
                                                value={formData.churchSlug}
                                                onChange={handleSlugChange}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">Este será o link de acesso da sua igreja.</p>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                                <CardTitle className="text-lg">Dados do Administrador</CardTitle>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" /> Nome Completo
                                        </label>
                                        <Input 
                                            placeholder="Seu nome" 
                                            required 
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-muted-foreground" /> CPF ou CNPJ
                                        </label>
                                        <Input 
                                            placeholder="Somente números" 
                                            required 
                                            value={formData.cpfCnpj}
                                            onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value.replace(/\D/g, '') })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-muted-foreground" /> Celular (WhatsApp)
                                        </label>
                                        <Input 
                                            placeholder="(DDD) 99999-9999" 
                                            required 
                                            value={formData.mobilePhone}
                                            onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" /> E-mail de Acesso
                                        </label>
                                        <Input 
                                            type="email" 
                                            placeholder="exemplo@email.com" 
                                            required 
                                            value={formData.adminEmail}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground italic">Você usará este e-mail para fazer login.</p>
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-muted-foreground" /> Senha de Acesso *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Mínimo 6 caracteres"
                                                required
                                                value={formData.adminPassword}
                                                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setShowPassword(v => !v)}
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">Esta será a sua senha de acesso ao sistema.</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                {/* Termos de Serviço */}
                                <div className="w-full flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                                    <Checkbox
                                        id="checkout-terms"
                                        checked={termsAccepted}
                                        onCheckedChange={(c) => setTermsAccepted(c === true)}
                                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="checkout-terms" className="text-sm font-semibold cursor-pointer leading-none">
                                            Li e concordo com os termos do serviço
                                        </Label>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Na falta de pagamento o serviço é pausado. O serviço pode ser cancelado a qualquer momento sem prejuízo de multas. O pagamento é cobrado após 30 dias da data da contratação.
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    className={cn('w-full py-4 sm:py-7 h-auto text-base sm:text-xl font-bold rounded-xl shadow-xl gap-2 sm:gap-3 group bg-gradient-to-r flex-col sm:flex-row text-center whitespace-normal', selectedPlan.color)}
                                    disabled={loading || !termsAccepted}
                                >
                                    <div className="flex items-center gap-2">
                                        {loading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />}
                                        <span>ASSINAR PLANO {selectedPlan.name.toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-90">— R$ {selectedPlan.price.toLocaleString('pt-BR')}/mês</span>
                                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform hidden sm:block" />
                                    </div>
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>

            <Dialog open={showFallback} onOpenChange={setShowFallback}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            Integração Offline
                        </DialogTitle>
                        <DialogDescription className="py-4">
                            O servidor de pagamentos (Edge Function) não está respondendo no momento. 
                            <br /><br />
                            Deseja continuar criando sua igreja no <strong>Modo de Teste Grátis (7 dias)</strong>? Você poderá configurar o pagamento depois.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowFallback(false)}>
                            Tentar novamente
                        </Button>
                        <Button onClick={handleTrialFallback} className="bg-emerald-600 hover:bg-emerald-700">
                            Continuar como Teste Grátis
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
