import { useState } from 'react';
import { Calendar, Plus, ListChecks, Users, Clock, MapPin, Tag, Search, Filter } from 'lucide-react';
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

interface Event {
    id: string;
    title: string;
    type: 'culto' | 'evento' | 'reuniao' | 'especial';
    date: string;
    time: string;
    location: string;
    description: string;
    responsible: string;
    status: 'planejado' | 'confirmado' | 'realizado' | 'cancelado';
    attendees?: number;
    checklist?: ChecklistItem[];
    serviceScale?: ServicePerson[];
}

interface ChecklistItem {
    id: string;
    task: string;
    completed: boolean;
    responsible?: string;
}

interface ServicePerson {
    id: string;
    role: string;
    name: string;
    confirmed: boolean;
}

const mockEvents: Event[] = [
    {
        id: '1',
        title: 'Culto de Celebração',
        type: 'culto',
        date: '2026-02-08',
        time: '19:00',
        location: 'Templo Principal',
        description: 'Culto dominical de celebração com louvor e palavra',
        responsible: 'Pastor João Silva',
        status: 'confirmado',
        attendees: 250,
        serviceScale: [
            { id: '1', role: 'Pregador', name: 'Pastor João Silva', confirmed: true },
            { id: '2', role: 'Louvor', name: 'Maria Santos', confirmed: true },
            { id: '3', role: 'Multimídia', name: 'Carlos Oliveira', confirmed: true },
        ],
        checklist: [
            { id: '1', task: 'Testar equipamento de som', completed: true },
            { id: '2', task: 'Preparar slides da pregação', completed: true },
            { id: '3', task: 'Organizar cadeiras', completed: false },
        ],
    },
    {
        id: '2',
        title: 'Conferência de Jovens 2026',
        type: 'especial',
        date: '2026-03-15',
        time: '18:00',
        location: 'Centro de Convenções',
        description: 'Grande conferência anual de jovens com palestrantes nacionais',
        responsible: 'Ana Paula Costa',
        status: 'planejado',
        attendees: 500,
    },
    {
        id: '3',
        title: 'Reunião de Liderança',
        type: 'reuniao',
        date: '2026-02-10',
        time: '20:00',
        location: 'Sala de Reuniões',
        description: 'Reunião mensal com líderes de ministérios',
        responsible: 'Pastor João Silva',
        status: 'confirmado',
        attendees: 25,
    },
];

export default function Events() {
    const [events] = useState<Event[]>(mockEvents);
    const [selectedTab, setSelectedTab] = useState('calendario');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('todos');
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [isCreateWorshipOpen, setIsCreateWorshipOpen] = useState(false);
    const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'todos' || event.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const getEventTypeColor = (type: Event['type']) => {
        const colors = {
            culto: 'bg-gradient-to-r from-primary to-secondary',
            evento: 'bg-gradient-to-r from-blue-500 to-cyan-500',
            reuniao: 'bg-gradient-to-r from-purple-500 to-pink-500',
            especial: 'bg-gradient-to-r from-amber-500 to-orange-500',
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
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Eventos & Agenda
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie cultos, eventos especiais e escalas de serviço
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all">
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
                            <CreateEventForm onClose={() => setIsCreateEventOpen(false)} />
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
                            <PlanWorshipForm onClose={() => setIsCreateWorshipOpen(false)} />
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
                            <CreateChecklistForm onClose={() => setIsCreateChecklistOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} getEventTypeColor={getEventTypeColor} getStatusBadge={getStatusBadge} />
                        ))}
                    </div>
                </TabsContent>

                {/* Escalas Tab */}
                <TabsContent value="escalas" className="space-y-4">
                    <ServiceScaleView events={filteredEvents.filter(e => e.serviceScale)} />
                </TabsContent>

                {/* Checklists Tab */}
                <TabsContent value="checklists" className="space-y-4">
                    <ChecklistView events={filteredEvents.filter(e => e.checklist)} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Event Card Component
function EventCard({ event, getEventTypeColor, getStatusBadge }: {
    event: Event;
    getEventTypeColor: (type: Event['type']) => string;
    getStatusBadge: (status: Event['status']) => string;
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
                    {event.attendees && (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span>{event.attendees} pessoas</span>
                        </div>
                    )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Responsável: <span className="font-semibold text-foreground">{event.responsible}</span>
                    </span>
                    <Button variant="outline" size="sm" className="hover:bg-primary/5">
                        Ver Detalhes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Calendar View Component
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
            {/* Calendar */}
            <Card className="border-primary/10 shadow-lg xl:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Calendário Anual</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                                Anterior
                            </Button>
                            <Button variant="outline" size="sm" onClick={goToNextMonth}>
                                Próximo
                            </Button>
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

            {/* Upcoming Events */}
            <Card className="border-primary/10 shadow-lg">
                <CardHeader>
                    <CardTitle>Próximos Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                            {events
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(event => (
                                    <div
                                        key={event.id}
                                        className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
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
                                ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

// Service Scale View Component
function ServiceScaleView({ events }: { events: Event[] }) {
    return (
        <div className="space-y-4">
            {events.map(event => (
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
                                <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${person.confirmed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        <div>
                                            <p className="font-semibold">{person.name}</p>
                                            <p className="text-sm text-muted-foreground">{person.role}</p>
                                        </div>
                                    </div>
                                    <Badge variant={person.confirmed ? 'default' : 'outline'}>
                                        {person.confirmed ? 'Confirmado' : 'Pendente'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Checklist View Component
function ChecklistView({ events }: { events: Event[] }) {
    return (
        <div className="space-y-4">
            {events.map(event => (
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
                                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors">
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
function CreateEventForm({ onClose }: { onClose: () => void }) {
    return (
        <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label>Título do Evento</Label>
                    <Input placeholder="Ex: Conferência de Jovens" />
                </div>
                <div>
                    <Label>Tipo</Label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="culto">Culto</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="reuniao">Reunião</SelectItem>
                            <SelectItem value="especial">Especial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Data</Label>
                    <Input type="date" />
                </div>
                <div>
                    <Label>Horário</Label>
                    <Input type="time" />
                </div>
                <div>
                    <Label>Local</Label>
                    <Input placeholder="Ex: Templo Principal" />
                </div>
                <div className="col-span-2">
                    <Label>Descrição</Label>
                    <Textarea placeholder="Descreva o evento..." rows={3} />
                </div>
                <div>
                    <Label>Responsável</Label>
                    <Input placeholder="Nome do responsável" />
                </div>
                <div>
                    <Label>Estimativa de Público</Label>
                    <Input type="number" placeholder="0" />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
                    Criar Evento
                </Button>
            </div>
        </form>
    );
}

function PlanWorshipForm({ onClose }: { onClose: () => void }) {
    return (
        <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label>Título do Culto</Label>
                    <Input placeholder="Ex: Culto de Celebração" />
                </div>
                <div>
                    <Label>Data</Label>
                    <Input type="date" />
                </div>
                <div>
                    <Label>Horário</Label>
                    <Input type="time" />
                </div>
                <div className="col-span-2">
                    <Label>Pregador</Label>
                    <Input placeholder="Nome do pregador" />
                </div>
                <div className="col-span-2">
                    <Label>Tema da Mensagem</Label>
                    <Input placeholder="Tema da pregação" />
                </div>
                <div className="col-span-2">
                    <Label>Líder de Louvor</Label>
                    <Input placeholder="Nome do líder de louvor" />
                </div>
                <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea placeholder="Observações adicionais..." rows={3} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
                    Salvar Planejamento
                </Button>
            </div>
        </form>
    );
}

function CreateChecklistForm({ onClose }: { onClose: () => void }) {
    return (
        <form className="space-y-4">
            <div className="space-y-4">
                <div>
                    <Label>Evento Relacionado</Label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um evento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Culto de Celebração</SelectItem>
                            <SelectItem value="2">Conferência de Jovens</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Template de Checklist</Label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="culto">Checklist de Culto</SelectItem>
                            <SelectItem value="evento">Checklist de Evento</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Tarefas (uma por linha)</Label>
                    <Textarea
                        placeholder="Testar equipamento de som&#10;Preparar slides&#10;Organizar cadeiras"
                        rows={6}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
                    Gerar Checklist
                </Button>
            </div>
        </form>
    );
}
