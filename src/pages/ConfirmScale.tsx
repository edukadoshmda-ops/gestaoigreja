import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Calendar, Clock, MapPin, Church, Heart, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { eventsService } from '@/services/events.service';

export default function ConfirmScale() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<'loading' | 'pending' | 'confirmed' | 'declined' | 'error'>('loading');
    const [details, setDetails] = useState<any>(null);

    const VERSES = [
        { text: "Servi de boa vontade, como se estivéssemos servindo ao Senhor...", ref: "Efésios 6:7" },
        { text: "Sede firmes e constantes, sempre abundantes na obra do Senhor, sabendo que o vosso trabalho não é vão.", ref: "1 Coríntios 15:58" },
        { text: "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.", ref: "Colossenses 3:23" },
        { text: "Assim brilhe a luz de vocês diante dos homens, para que vejam as suas boas obras e glorifiquem ao Pai.", ref: "Mateus 5:16" },
        { text: "E não nos cansemos de fazer o bem, pois no tempo próprio colheremos, se não desistirmos.", ref: "Gálatas 6:9" },
        { text: "Deus não é injusto; ele não se esquecerá do trabalho de vocês e do amor que demonstraram por ele.", ref: "Hebreus 6:10" },
        { text: "O que você fizer, faça com toda a sua dedicação, pois o serviço que você presta é para o Senhor.", ref: "Eclesiastes 9:10" }
    ];

    const getVerse = (seed: string) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return VERSES[Math.abs(hash) % VERSES.length];
    };

    const verse = id ? getVerse(id) : VERSES[0];

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    useEffect(() => {
        if (id) {
            loadDetails();
        }
    }, [id]);

    async function loadDetails() {
        try {
            setLoading(true);
            const result = await eventsService.getScaleDetailsPublic(id!) as any;

            if (!result) throw new Error('Convite não encontrado');

            setDetails({
                member: { name: result.member_name },
                event: {
                    title: result.event_title,
                    date: result.event_date,
                    time: result.event_time
                },
                role: result.role,
                confirmed: result.confirmed,
                declined: result.declined
            });

            if (result.confirmed) setStatus('confirmed');
            else if (result.declined) setStatus('declined');
            else setStatus('pending');

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(confirm: boolean) {
        try {
            setProcessing(true);
            const result = await eventsService.confirmParticipationPublic(id!, confirm) as any;

            if (!result || !result.success) throw new Error('Falha na operação');

            setStatus(confirm ? 'confirmed' : 'declined');
        } catch (error) {
            console.error('Erro ao processar:', error);
            alert('Ocorreu um erro ao processar sua resposta. Tente novamente.');
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-full shadow-xl">
                        <Church className="h-12 w-12 text-primary animate-bounce" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Carregando convite...</h2>
                <div className="mt-8 flex gap-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-red-50 space-y-6">
                        <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
                            <span className="text-4xl animate-bounce">⚠️</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900"> Convite Expirado</h3>
                            <p className="text-slate-500 font-medium px-4">
                                Não conseguimos encontrar esse convite. Ele pode ter sido removido ou o link está incorreto.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="w-full h-14 rounded-2xl border-2 hover:bg-slate-50 font-bold text-slate-700">
                            <Link to="/login">Voltar para o Início</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans select-none">
            {/* Background Decorativo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md w-full relative">
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header Icon */}
                    <div className="flex justify-center -mb-12 relative z-10 transition-transform hover:scale-105 duration-300">
                        <div className="bg-white p-1 rounded-3xl shadow-2xl border-4 border-white">
                            {status === 'confirmed' ? (
                                <div className="bg-gradient-to-br from-green-400 to-green-600 p-5 rounded-[22px] shadow-inner">
                                    <CheckCircle2 className="h-10 w-10 text-white" />
                                </div>
                            ) : status === 'declined' ? (
                                <div className="bg-gradient-to-br from-red-400 to-red-600 p-5 rounded-[22px] shadow-inner">
                                    <XCircle className="h-10 w-10 text-white" />
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-primary to-orange-600 p-5 rounded-[22px] shadow-inner">
                                    <HelpCircle className="h-10 w-10 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl pt-14">
                        <CardContent className="px-8 pb-8 space-y-8">
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                                    {status === 'confirmed' ? 'Confirmado!' : status === 'declined' ? 'Recusado' : 'Olá!'}
                                </h1>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    {status === 'confirmed' ? (
                                        <>Ficamos felizes com sua disposição em servir, <span className="text-primary font-bold">{details?.member?.name.split(' ')[0]}</span>!</>
                                    ) : status === 'declined' ? (
                                        <>Poxa, que pena que não poderá estar conosco, <span className="text-slate-900 font-bold">{details?.member?.name.split(' ')[0]}</span>.</>
                                    ) : (
                                        <>Você foi escalado para servir no próximo evento, <span className="text-primary font-bold">{details?.member?.name.split(' ')[0]}</span>.</>
                                    )}
                                </p>
                            </div>

                            {/* Event Info Card */}
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-2xl">
                                        <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Evento</p>
                                        <p className="font-bold text-slate-800 text-lg leading-tight">{details?.event?.title}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold text-slate-700">{details?.event?.time}</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold text-slate-700">
                                            {formatDate(details?.event?.date)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                                    <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">
                                        Sua função: <span className="text-slate-900 font-bold">{details?.role}</span>
                                    </p>
                                </div>
                            </div>

                            {status === 'pending' && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button
                                        onClick={() => handleAction(false)}
                                        disabled={processing}
                                        variant="outline"
                                        className="h-14 rounded-2xl font-bold border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : 'Recusar'}
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(true)}
                                        disabled={processing}
                                        className="h-14 rounded-2xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : 'Confirmar'}
                                    </Button>
                                </div>
                            )}

                            {status !== 'pending' && (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-2xl text-center text-sm font-bold ${status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        Sua resposta foi registrada com sucesso!
                                    </div>
                                    <Button asChild variant="ghost" className="w-full h-12 rounded-xl text-slate-500 font-medium hover:bg-slate-50" onClick={() => setStatus('pending')}>
                                        <button>Alterar resposta</button>
                                    </Button>

                                    <Button asChild className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                                        <Link to="/login" className="flex items-center justify-center gap-2">
                                            Entrar no App <ArrowRight className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                </div>
                            )}

                            {/* Verse / Motivational */}
                            <div className="relative group overflow-hidden bg-primary p-6 rounded-[24px] text-white shadow-lg transition-all hover:shadow-primary/20">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <Heart className="h-20 w-20 fill-white" />
                                </div>
                                <p className="relative text-sm font-medium italic leading-relaxed opacity-90">
                                    "{verse.text}"
                                </p>
                                <p className="relative text-[10px] font-bold mt-2 uppercase tracking-widest border-t border-white/20 pt-2 inline-block">
                                    {verse.ref}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center px-6">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                            © {new Date().getFullYear()} • Gestão Igreja Multi-Tenant • Premium
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
