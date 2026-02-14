import { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, ListChecks, Users, Clock, MapPin, Tag, Search, Filter, Loader2, CheckCircle2, AlertCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MonthCalendar } from '@/components/MonthCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '@/services/events.service';
import { membersService } from '@/services/members.service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface Event {
    id: string;
    title: string;
    type: 'culto' | 'evento' | 'reuniao' | 'especial';
    date: string;
    time: string;
    location: string;
    description: string;
    responsible: string;
    responsiblePhone?: string;
    status: 'planejado' | 'confirmado' | 'realizado' | 'cancelado';
    attendees?: number;
    checklist?: ChecklistItem[];
    serviceScale?: ServicePerson[];
}

interface ChecklistItem {
    id: string;
    task: string;
    completed: boolean;
}

interface ServicePerson {
    id: string;
    name: string;
    role: string;
    phone?: string;
    confirmed: boolean;
}

export default function Events() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('calendario');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('todos');
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [isCreateWorshipOpen, setIsCreateWorshipOpen] = useState(false);
    const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false);
    const [isCreateScaleOpen, setIsCreateScaleOpen] = useState(false);
    const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    responsible:members!events_responsible_id_fkey(name, phone),
                    checklist:event_checklists(*),
                    serviceScale:service_scales(*, member:members(name, phone))
                `)
                .order('date', { ascending: false });

            if (error) throw error;

            const mappedEvents: Event[] = (data || []).map((e: any) => ({
                id: e.id,
                title: e.title,
                type: e.type,
                date: e.date,
                time: e.time,
                location: e.location || '',
                description: e.description || '',
                responsible: e.responsible?.name || 'Não definido',
                responsiblePhone: e.responsible?.phone,
                status: e.status,
                attendees: e.actual_attendees || e.estimated_attendees,
                checklist: (e.checklist || []).map((c: any) => ({
                    id: c.id,
                    task: c.task,
                    completed: c.completed
                })),
                serviceScale: (e.serviceScale || []).map((s: any) => ({
                    id: s.id,
                    name: s.member?.name || 'Não definido',
                    phone: s.member?.phone,
                    role: s.role,
                    confirmed: s.confirmed
                }))
            }));
            setEvents(mappedEvents);
        } catch (error) {
            console.error('Error loading events:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os eventos.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const handleToggleTask = async (taskId: string, currentStatus: boolean, eventId: string) => {
        try {
            await eventsService.toggleChecklistItem(taskId, !currentStatus);
            loadEvents();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const handleToggleConfirmation = async (scaleId: string, currentStatus: boolean, eventId: string) => {
        try {
            await eventsService.confirmServiceScale(scaleId, !currentStatus);
            loadEvents();
            toast({ title: 'Status atualizado', description: 'Confirmação de participação alterada.' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'todos' || event.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const getEventTypeColor = (type: Event['type']) => {
        const colors = {
            culto: 'bg-primary',
            evento: 'bg-blue-500',
            reuniao: 'bg-purple-500',
            especial: 'bg-amber-500',
        };
        return colors[type];
    };

    const getStatusBadge = (status: Event['status']) => {
        const variants = {
            planejado: 'bg-blue-100 text-blue-800 border-blue-200',
            confirmado: 'bg-green-100 text-green-800 border-green-200',
            realizado: 'bg-gray-100 text-gray-800 border-gray-200',
            cancelado: 'bg-red-100 text-red-800 border-red-200',
        };
        return variants[status];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        Eventos & Agenda
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie cultos, eventos especiais e escalas de serviço
                    </p>
                </div>
                {user?.role && !['aluno', 'membro', 'congregado', 'tesoureiro'].includes(user.role) && (
                    <div className="flex gap-2 flex-wrap">
                        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-primary-foreground hover:shadow-lg transition-all">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Evento
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Evento</DialogTitle>
                                    <DialogDescription>
                                        Preencha as informações do evento
                                    </DialogDescription>
                                </DialogHeader>
                                <CreateEventForm onClose={() => setIsCreateEventOpen(false)} onSuccess={loadEvents} />
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCreateWorshipOpen} onOpenChange={setIsCreateWorshipOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-primary/30 hover:bg-primary/5">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Planejar Culto
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Planejar Culto</DialogTitle>
                                    <DialogDescription>
                                        Configure todos os detalhes do culto
                                    </DialogDescription>
                                </DialogHeader>
                                <PlanWorshipForm onClose={() => setIsCreateWorshipOpen(false)} onSuccess={loadEvents} />
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCreateChecklistOpen} onOpenChange={setIsCreateChecklistOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-primary/30 hover:bg-primary/5">
                                    <ListChecks className="h-4 w-4 mr-2" />
                                    Gerar Checklist
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Gerar Checklist Operacional</DialogTitle>
                                    <DialogDescription>
                                        Crie uma lista de tarefas para o evento
                                    </DialogDescription>
                                </DialogHeader>
                                <CreateChecklistForm
                                    onClose={() => setIsCreateChecklistOpen(false)}
                                    events={events}
                                    onSuccess={loadEvents}
                                />
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isCreateScaleOpen} onOpenChange={setIsCreateScaleOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-primary-foreground hover:shadow-lg transition-all gap-2">
                                    <Users className="h-4 w-4" />
                                    Escalar Equipe
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Escalar Equipe de Serviço</DialogTitle>
                                    <DialogDescription>
                                        Designe membros para funções específicas no evento
                                    </DialogDescription>
                                </DialogHeader>
                                <ManageScaleForm
                                    onClose={() => setIsCreateScaleOpen(false)}
                                    events={events}
                                    onSuccess={loadEvents}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Search and Filter */}
            <Card className="border-primary/10 shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar eventos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filtrar por tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Tipos</SelectItem>
                                <SelectItem value="culto">Cultos</SelectItem>
                                <SelectItem value="evento">Eventos</SelectItem>
                                <SelectItem value="reuniao">Reuniões</SelectItem>
                                <SelectItem value="especial">Especiais</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="calendario" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Calendário</span>
                    </TabsTrigger>
                    <TabsTrigger value="eventos" className="gap-2">
                        <Tag className="h-4 w-4" />
                        <span className="hidden sm:inline">Eventos</span>
                    </TabsTrigger>
                    <TabsTrigger value="escalas" className="gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Escalas</span>
                    </TabsTrigger>
                    <TabsTrigger value="checklists" className="gap-2">
                        <ListChecks className="h-4 w-4" />
                        <span className="hidden sm:inline">Checklists</span>
                    </TabsTrigger>
                </TabsList>

                {/* Calendário Tab */}
                <TabsContent value="calendario" className="space-y-4">
                    <CalendarView events={filteredEvents} getEventTypeColor={getEventTypeColor} />
                </TabsContent>

                {/* Eventos Tab */}
                <TabsContent value="eventos" className="space-y-4">
                    {filteredEvents.length === 0 ? (
                        <Card className="border-primary/10 shadow-lg">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Calendar className="h-16 w-16 text-primary/30 mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">Nenhum evento cadastrado</h3>
                                <p className="text-muted-foreground max-w-md">Crie seu primeiro evento clicando no botão "Criar Evento" acima.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    getEventTypeColor={getEventTypeColor}
                                    getStatusBadge={getStatusBadge}
                                    onViewDetails={() => setSelectedEventDetails(event)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Escalas Tab */}
                <TabsContent value="escalas" className="space-y-4">
                    <ServiceScaleView events={filteredEvents} onToggleConfirmation={handleToggleConfirmation} />
                </TabsContent>

                {/* Checklists Tab */}
                <TabsContent value="checklists" className="space-y-4">
                    <ChecklistView events={filteredEvents} onToggleTask={handleToggleTask} />
                </TabsContent>
            </Tabs>

            <EventDetailsDialog
                event={selectedEventDetails}
                onClose={() => setSelectedEventDetails(null)}
                getEventTypeColor={getEventTypeColor}
                getStatusBadge={getStatusBadge}
            />
        </div>
    );
}

// Sub-components

function EventCard({ event, getEventTypeColor, getStatusBadge, onViewDetails }: {
    event: Event;
    getEventTypeColor: (type: Event['type']) => string;
    getStatusBadge: (status: Event['status']) => string;
    onViewDetails: () => void;
}) {
    return (
        <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
            <div className={`h-2 ${getEventTypeColor(event.type)}`} />
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
                        <CardDescription className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className={getStatusBadge(event.status)}>
                                {event.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                                {event.type}
                            </Badge>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{event.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.location}</span>
                    </div>
                    {event.attendees !== undefined && (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span>{event.attendees} pessoas</span>
                        </div>
                    )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Responsável: <span className="font-semibold text-foreground">{event.responsible}</span>
                        </span>
                        {(event as any).responsiblePhone && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                    const text = `Olá ${event.responsible.split(' ')[0]}, Graça e Paz! Gostaria de falar sobre o evento *${event.title}* do dia ${new Date(event.date).toLocaleDateString('pt-BR')}.`;
                                    const cleanPhone = ((event as any).responsiblePhone || '').replace(/\D/g, '');
                                    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                                    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                            >
                                <MessageSquare className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-primary/5 group/btn" onClick={onViewDetails}>
                        Ver Detalhes
                        <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function CalendarView({ events, getEventTypeColor }: {
    events: Event[];
    getEventTypeColor: (type: Event['type']) => string;
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="border-primary/10 shadow-lg xl:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Calendário Anual</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>Anterior</Button>
                            <Button variant="outline" size="sm" onClick={goToNextMonth}>Próximo</Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center text-2xl font-bold capitalize">
                            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </div>
                        <MonthCalendar
                            year={currentMonth.getFullYear()}
                            month={currentMonth.getMonth()}
                            events={events}
                            onDayClick={(date) => console.log('Clicked date:', date)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                    <CardTitle>Próximos Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                            {events.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Calendar className="h-12 w-12 text-primary/20 mb-3" />
                                    <p className="text-sm text-muted-foreground">Nenhum evento agendado</p>
                                </div>
                            ) : (
                                events
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map(event => (
                                        <div
                                            key={event.id}
                                            className="p-4 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm mb-1">{event.title}</p>
                                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(event.date).toLocaleDateString('pt-BR')}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {event.time}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge className={`${getEventTypeColor(event.type)} text-white text-xs`}>
                                                    {event.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

function ServiceScaleView({ events, onToggleConfirmation }: { events: Event[], onToggleConfirmation: (id: string, current: boolean, eventId: string) => void }) {
    const eventWithScale = events.filter(e => e.serviceScale && e.serviceScale.length > 0);

    if (eventWithScale.length === 0) {
        return (
            <Card className="border-primary/10 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="h-16 w-16 text-primary/30 mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma escala cadastrada</h3>
                    <p className="text-muted-foreground max-w-md">As escalas de serviço aparecerão aqui quando forem adicionadas aos eventos.</p>
                </CardContent>
            </Card>
        );
    }
    return (
        <div className="space-y-4">
            {eventWithScale.map(event => (
                <Card key={event.id} className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{event.title}</span>
                            <Badge>{new Date(event.date).toLocaleDateString('pt-BR')}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {event.serviceScale?.map(person => (
                                <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${person.confirmed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        <div>
                                            <p className="font-semibold">{person.name}</p>
                                            <p className="text-sm text-muted-foreground">{person.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={person.confirmed ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => onToggleConfirmation(person.id, person.confirmed, event.id)}
                                        >
                                            {person.confirmed ? 'Confirmado' : 'Pendente'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-green-600 hover:bg-green-50"
                                            title="Enviar convocação via WhatsApp"
                                            onClick={() => {
                                                const phone = person.phone || '';
                                                if (phone) {
                                                    const isGuest = person.role === 'Convidado';
                                                    const confirmationUrl = `${window.location.origin}/confirmar/${person.id}`;
                                                    const text = isGuest
                                                        ? `Olá ${person.name}, Graça e Paz! Gostaria de te convidar para o evento *${event.title}* que teremos no dia ${new Date(event.date).toLocaleDateString('pt-BR')} às ${event.time}. Sua presença seria uma alegria para nós!\n\nConfirme sua presença clicando no link abaixo:\n${confirmationUrl}`
                                                        : `Olá ${person.name}, Graça e Paz! Você foi escalado para a função de *${person.role}* no evento *${event.title}* no dia ${new Date(event.date).toLocaleDateString('pt-BR')}. Poderia confirmar sua presença?\n\nConfirme clicando aqui:\n${confirmationUrl}`;

                                                    const cleanPhone = phone.replace(/\D/g, '');
                                                    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                                                    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                                } else {
                                                    alert('Membro não possui telefone cadastrado.');
                                                }
                                            }}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ChecklistView({ events, onToggleTask }: { events: Event[], onToggleTask: (id: string, completed: boolean, eventId: string) => void }) {
    const eventsWithChecklist = events.filter(e => e.checklist && e.checklist.length > 0);

    if (eventsWithChecklist.length === 0) {
        return (
            <Card className="border-primary/10 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <ListChecks className="h-16 w-16 text-primary/30 mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhum checklist cadastrado</h3>
                    <p className="text-muted-foreground max-w-md">Crie checklists operacionais clicando no botão "Gerar Checklist" acima.</p>
                </CardContent>
            </Card>
        );
    }
    return (
        <div className="space-y-4">
            {eventsWithChecklist.map(event => (
                <Card key={event.id} className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{event.title}</span>
                            <Badge>{new Date(event.date).toLocaleDateString('pt-BR')}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {event.checklist?.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
                                    onClick={() => onToggleTask(item.id, item.completed, event.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        className="w-5 h-5 rounded border-primary"
                                        readOnly
                                    />
                                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                        {item.task}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Form Components

function CreateEventForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
    const [memberSearch, setMemberSearch] = useState('');

    useEffect(() => {
        loadMembers();
    }, []);

    async function loadMembers() {
        try {
            const data = await membersService.getActive();
            setAllMembers(data || []);
        } catch (error) {
            console.error(error);
        }
    }

    const filteredMembers = allMembers.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            setLoading(true);
            if (!user?.churchId) throw new Error('Igreja não identificada.');

            const newEvent = await eventsService.create({
                title: formData.get('title') as string,
                type: formData.get('type') as any,
                date: formData.get('date') as string,
                time: formData.get('time') as string,
                location: formData.get('location') as string,
                description: formData.get('description') as string,
                status: 'planejado',
                estimated_attendees: Number(formData.get('attendees')) || 0,
            }, user.churchId);

            // Add selected guests to service scale as 'Convidado'
            if (selectedGuests.length > 0) {
                await Promise.all(selectedGuests.map(memberId =>
                    eventsService.addToServiceScale(newEvent.id, memberId, 'Convidado')
                ));
            }

            toast({
                title: 'Evento criado!',
                description: selectedGuests.length > 0
                    ? `${selectedGuests.length} convidados foram adicionados.`
                    : 'Evento criado com sucesso.'
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: 'Erro ao criar evento', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="title">Título do Evento</Label>
                    <Input id="title" name="title" placeholder="Ex: Conferência de Jovens" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" defaultValue="evento">
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="culto">Culto</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="reuniao">Reunião</SelectItem>
                            <SelectItem value="especial">Especial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="attendees">Expectativa de Público</Label>
                    <Input id="attendees" name="attendees" type="number" placeholder="Ex: 100" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input id="time" name="time" type="time" required />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="location">Local</Label>
                    <Input id="location" name="location" placeholder="Ex: Templo Principal" />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" placeholder="Detalhes sobre o evento..." />
                </div>

                <Separator className="col-span-2 my-2" />

                <div className="col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Convidar Membros (WhatsApp)
                        </Label>
                        <Badge variant="secondary">{selectedGuests.length} selecionados</Badge>
                    </div>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar membros..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="pl-9 h-8 text-xs"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-xl p-3 bg-muted/5 max-h-48 overflow-y-auto">
                        {filteredMembers.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4 col-span-2">Nenhum membro encontrado.</p>
                        ) : (
                            filteredMembers.map((m: any) => (
                                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all">
                                    <input
                                        type="checkbox"
                                        id={`guest-${m.id}`}
                                        className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
                                        checked={selectedGuests.includes(m.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedGuests([...selectedGuests, m.id]);
                                            else setSelectedGuests(selectedGuests.filter(id => id !== m.id));
                                        }}
                                    />
                                    <label htmlFor={`guest-${m.id}`} className="text-xs font-medium cursor-pointer flex-1 truncate">
                                        {m.name}
                                    </label>
                                </div>
                            ))
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        * Os selecionados serão adicionados à escala do evento e você poderá enviar o convite individualmente após salvar.
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Evento
                </Button>
            </div>
        </form>
    );
}

function PlanWorshipForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            setLoading(true);
            if (!user?.churchId) throw new Error('Igreja não identificada.');

            // Planejamento rápido de culto
            await eventsService.create({
                title: formData.get('title') as string || 'Culto de Adoração',
                type: 'culto',
                date: formData.get('date') as string,
                time: formData.get('time') as string || '19:00',
                location: 'Templo Principal',
                description: 'Culto regular de adoração e palavra.',
                status: 'planejado',
            }, user.churchId);

            toast({ title: 'Culto planejado!', description: 'O evento foi adicionado à agenda.' });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: 'Erro ao planejar culto', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="w-title">Nome do Culto</Label>
                <Input id="w-title" name="title" placeholder="Ex: Culto de Celebração" defaultValue="Culto de Adoração" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="w-date">Data</Label>
                    <Input id="w-date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="w-time">Horário</Label>
                    <Input id="w-time" name="time" type="time" defaultValue="19:00" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Planejar Culto
                </Button>
            </div>
        </form>
    );
}

function CreateChecklistForm({ onClose, events, onSuccess }: { onClose: () => void; events: Event[]; onSuccess: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [tasks, setTasks] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEventId || !tasks.trim()) return;

        try {
            setLoading(true);
            const taskList = tasks.split('\n').filter(t => t.trim());

            await Promise.all(taskList.map(task =>
                eventsService.addChecklistItem(selectedEventId, task.trim())
            ));

            toast({ title: 'Checklist gerado!', description: 'As tarefas foram adicionadas ao evento.' });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: 'Erro ao gerar checklist', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Selecione o Evento</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o evento..." />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                                {event.title} ({new Date(event.date).toLocaleDateString('pt-BR')})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Tarefas (Uma por linha)</Label>
                <Textarea
                    value={tasks}
                    onChange={(e) => setTasks(e.target.value)}
                    placeholder="Ex:&#10;Som e Projeção&#10;Organizar cadeiras&#10;Preparar Santa Ceia"
                    rows={6}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={loading || !selectedEventId || !tasks.trim()}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Gerar Checklist
                </Button>
            </div>
        </form>
    );
}

function ManageScaleForm({ onClose, events, onSuccess }: { onClose: () => void; events: Event[]; onSuccess: () => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [role, setRole] = useState<string>('');

    useEffect(() => {
        loadMembers();
    }, []);

    async function loadMembers() {
        try {
            const data = await membersService.getAll();
            setMembers(data || []);
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEventId || !selectedMemberId || !role.trim()) return;

        try {
            setLoading(true);
            await eventsService.addToServiceScale(selectedEventId, selectedMemberId, role.trim());

            toast({ title: 'Membro escalado!', description: 'A escala foi atualizada com sucesso.' });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: 'Erro ao escalar', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyTemplate = async (templateType: 'culto' | 'jovens') => {
        const templates = {
            culto: [
                { role: 'Som / Projeção' },
                { role: 'Louvor (Violão)' },
                { role: 'Louvor (Vocal)' },
                { role: 'Recepção (Porta)' },
                { role: 'Pregação' }
            ],
            jovens: [
                { role: 'Som / Projeção' },
                { role: 'Líder de Quebra-gelo' },
                { role: 'Louvor' },
                { role: 'Palavra' }
            ]
        };

        const roles = templates[templateType];
        toast({
            title: 'Template Sugerido',
            description: `Dica: Escale membros para as funções de: ${roles.map(r => r.role).join(', ')}.`,
        });
        setRole(roles[0].role);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleApplyTemplate('culto')} className="text-[10px] h-7 border-primary/20">Template Culto</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleApplyTemplate('jovens')} className="text-[10px] h-7 border-primary/20">Template Jovens</Button>
            </div>
            <div className="space-y-2">
                <Label>Selecione o Evento</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o evento..." />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                                {event.title} ({new Date(event.date).toLocaleDateString('pt-BR')})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Selecione o Membro</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o membro..." />
                    </SelectTrigger>
                    <SelectContent>
                        {members.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                                {member.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Função/Cargo</Label>
                <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Pregador, Recepcionista, Som, etc."
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={loading || !selectedEventId || !selectedMemberId || !role.trim()}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Escala
                </Button>
            </div>
        </form>
    );
}

function EventDetailsDialog({ event, onClose, getEventTypeColor, getStatusBadge }: {
    event: Event | null;
    onClose: () => void;
    getEventTypeColor: (type: Event['type']) => string;
    getStatusBadge: (status: Event['status']) => string;
}) {
    if (!event) return null;

    return (
        <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getStatusBadge(event.status)}>
                            {event.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                            {event.type}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
                    <DialogDescription>
                        {event.description || 'Sem descrição detalhada.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Data</p>
                                <p className="text-muted-foreground">{new Date(event.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Horário</p>
                                <p className="text-muted-foreground">{event.time}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Local</p>
                                <p className="text-muted-foreground">{event.location}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">Responsável</p>
                                <p className="text-muted-foreground">{event.responsible}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold flex items-center gap-2">
                            <ListChecks className="h-4 w-4" />
                            Checklist do Evento
                        </h4>
                        <div className="space-y-2 border rounded-xl p-3 bg-muted/5 min-h-[100px]">
                            {event.checklist && event.checklist.length > 0 ? (
                                event.checklist.map(item => (
                                    <div key={item.id} className="flex items-center gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${item.completed ? 'bg-green-500' : 'bg-muted'}`} />
                                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                            {item.task}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma tarefa pendente.</p>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4 pt-2">
                    <h4 className="font-bold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Equipe Escalada
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {event.serviceScale && event.serviceScale.length > 0 ? (
                            event.serviceScale.map(person => (
                                <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <div>
                                        <p className="font-semibold text-sm">{person.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{person.role}</p>
                                    </div>
                                    <Badge variant={person.confirmed ? 'default' : 'outline'} className="text-[10px] h-5">
                                        {person.confirmed ? 'Confirmado' : 'Pendente'}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground col-span-2 py-4">Nenhuma escala definida para este evento.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={onClose}>Fechar</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
