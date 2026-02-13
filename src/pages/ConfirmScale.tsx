import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Calendar, Clock, MapPin, Church } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { eventsService } from '@/services/events.service';

export default function ConfirmScale() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [details, setDetails] = useState<any>(null);

    useEffect(() => {
        if (id) {
            confirmParticipation();
        }
    }, [id]);

    async function confirmParticipation() {
        try {
            setLoading(true);
            // Calls the RPC that handles RLS bypass and returns details
            const result = await eventsService.confirmParticipationPublic(id!) as any;

            if (!result || !result.success) throw new Error('Não foi possível confirmar');

            setDetails({
                member: { name: result.member_name },
                event: {
                    title: result.event_title,
                    date: result.event_date,
                    time: result.event_time
                },
                role: result.role
            });

            setStatus('success');
        } catch (error) {
            console.error('Erro ao confirmar:', error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-primary/20 shadow-2xl overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Church className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-primary">Confirmação de Escala</CardTitle>
                    <CardDescription>Gestão Igreja - Ministério de Louvor e Adoração</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center py-8 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Confirmando sua presença...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6 text-center">
                            <div className="flex flex-col items-center space-y-2">
                                <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-500" />
                                <h3 className="text-xl font-bold text-foreground">Presença Confirmada!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Olá <span className="font-bold text-primary">{details?.member?.name}</span>, sua confirmação foi registrada com sucesso.
                                </p>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 text-left space-y-3">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Detalhes do Evento</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{details?.event?.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4 text-primary/60" />
                                        <span>{new Date(details?.event?.date).toLocaleDateString('pt-BR')} às {details?.event?.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-primary/60" />
                                        <span>Sua função: <span className="font-bold text-foreground">{details?.role}</span></span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground italic">
                                "Tudo o que fizerem, façam de todo o coração, como para o Senhor." (Colossenses 3:23)
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-8 space-y-4">
                            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-destructive">Ops! Algo deu errado.</h3>
                            <p className="text-sm text-muted-foreground">
                                Não conseguimos processar sua confirmação. O link pode estar expirado ou o convite foi removido.
                            </p>
                            <Button asChild variant="outline" className="mt-4">
                                <Link to="/login">Ir para o Início</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>

                <div className="p-4 bg-muted/50 border-t text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                        © {new Date().getFullYear()} Gestão Igreja Premium
                    </p>
                </div>
            </Card>
        </div>
    );
}
