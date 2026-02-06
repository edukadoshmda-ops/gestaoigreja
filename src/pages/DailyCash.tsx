import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Trash2,
    Printer,
    Download,
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Loader2,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { financialService } from '@/services/financial.service';
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

export default function DailyCash() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { toast } = useToast();

    // Form states
    const [type, setType] = useState<'entrada' | 'saida'>('entrada');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Institution info (could be moved to a settings service later)
    const [churchName, setChurchName] = useState('Igreja Evangélica Flock Care');
    const [pastorName, setPastorName] = useState('');
    const [treasurerName, setTreasurerName] = useState('');
    const [comissionName, setComissionName] = useState('');

    useEffect(() => {
        loadTransactions();
    }, [selectedDate]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const start = format(startOfDay(selectedDate), 'yyyy-MM-dd');
            const end = format(endOfDay(selectedDate), 'yyyy-MM-dd');
            const data = await financialService.getByDateRange(start, end);
            setTransactions(data);
        } catch (error: any) {
            toast({
                title: 'Erro ao carregar',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category) return;

        try {
            setSubmitting(true);
            await financialService.create({
                type,
                category,
                amount: parseFloat(amount),
                description,
                date: format(selectedDate, 'yyyy-MM-dd'),
            });

            toast({
                title: 'Lançamento realizado',
                description: 'A transação foi registrada com sucesso.',
            });

            setAmount('');
            setDescription('');
            setCategory('');
            loadTransactions();
        } catch (error: any) {
            toast({
                title: 'Erro no lançamento',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este lançamento?')) return;
        try {
            await financialService.delete(id);
            loadTransactions();
        } catch (error: any) {
            toast({
                title: 'Erro ao excluir',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const totalIncome = transactions
        .filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpenses;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 pb-20 print:p-0 print:pb-0">
            {/* Search/Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Caixa Diário
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Controle de entradas e saídas diárias
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lançamento Form */}
                <Card className="lg:col-span-1 print:hidden border-primary/20 shadow-md">
                    <CardHeader>
                        <CardTitle>Novo Lançamento</CardTitle>
                        <CardDescription>Registre dízimos, ofertas ou despesas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={type === 'entrada' ? 'default' : 'outline'}
                                    onClick={() => setType('entrada')}
                                    className={type === 'entrada' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                                    Entrada
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === 'saida' ? 'default' : 'outline'}
                                    onClick={() => setType('saida')}
                                    className={type === 'saida' ? 'bg-red-600 hover:bg-red-700' : ''}
                                >
                                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                                    Saída
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Categoria</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {type === 'entrada' ? (
                                            <>
                                                <SelectItem value="Dízimo">Dízimo</SelectItem>
                                                <SelectItem value="Oferta">Oferta</SelectItem>
                                                <SelectItem value="Oferta Especial">Oferta Especial</SelectItem>
                                                <SelectItem value="Doação">Doação</SelectItem>
                                                <SelectItem value="Outros">Outros</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="Aluguel">Aluguel</SelectItem>
                                                <SelectItem value="Água/Luz">Água/Luz</SelectItem>
                                                <SelectItem value="Pessoal">Pessoal</SelectItem>
                                                <SelectItem value="Missões">Missões</SelectItem>
                                                <SelectItem value="Manutenção">Manutenção</SelectItem>
                                                <SelectItem value="Outros">Outros</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Valor (R$)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descrição</label>
                                <Input
                                    placeholder="Nome do doador ou motivo da despesa"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                                Lançar no Caixa
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Listagem e Relatório */}
                <div className="lg:col-span-2 space-y-6 print:w-full print:m-0">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 print:hidden">
                        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                            <CardContent className="p-4">
                                <p className="text-xs font-semibold text-green-600 uppercase">Entradas</p>
                                <p className="text-2xl font-bold text-green-700">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
                            <CardContent className="p-4">
                                <p className="text-xs font-semibold text-red-600 uppercase">Saídas</p>
                                <p className="text-2xl font-bold text-red-700">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4">
                                <p className="text-xs font-semibold text-primary uppercase">Saldo</p>
                                <p className="text-2xl font-bold">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Container */}
                    <div id="printable-report" className="bg-white text-black p-0 rounded-lg overflow-hidden border print:border-none">
                        {/* Report Header (Only visible in print or special view) */}
                        <div className="hidden print:flex flex-col items-center p-8 border-b-2 border-black mb-6">
                            <Logo size="md" showText={false} />
                            <h1 className="text-2xl font-bold mt-4 uppercase">{churchName}</h1>
                            <h2 className="text-xl font-bold">BOLETIM DE CAIXA DIÁRIO</h2>
                            <p className="text-lg">Data: {format(selectedDate, "dd/MM/yyyy")}</p>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 print:hidden">
                                <h3 className="font-bold flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Movimentação do Dia
                                </h3>
                            </div>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 print:border-black">
                                        <th className="text-left py-2 font-bold">Categoria</th>
                                        <th className="text-left py-2 font-bold">Descrição</th>
                                        <th className="text-right py-2 font-bold">Entrada</th>
                                        <th className="text-right py-2 font-bold">Saída</th>
                                        <th className="text-right py-2 font-bold print:hidden w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="border-b border-slate-100 print:border-slate-300">
                                            <td className="py-2 font-medium">{t.category}</td>
                                            <td className="py-2 text-muted-foreground print:text-black">{t.description || '-'}</td>
                                            <td className="py-2 text-right text-green-600 print:text-black">
                                                {t.type === 'entrada' ? `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                            </td>
                                            <td className="py-2 text-right text-red-600 print:text-black">
                                                {t.type === 'saida' ? `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                            </td>
                                            <td className="py-2 text-right print:hidden">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(t.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                Nenhum lançamento registrado neste dia.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-200 print:border-black font-bold">
                                        <td colSpan={2} className="py-4 text-right pr-4 uppercase">Totais do Dia:</td>
                                        <td className="py-4 text-right text-green-600 print:text-black">
                                            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 text-right text-red-600 print:text-black">
                                            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="print:hidden"></td>
                                    </tr>
                                    <tr className="bg-slate-50 print:bg-slate-100 font-bold">
                                        <td colSpan={2} className="py-3 text-right pr-4 uppercase">Saldo Final:</td>
                                        <td colSpan={2} className="py-3 text-right text-lg">
                                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="print:hidden"></td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Signatures Area (Only Print) */}
                            <div className="hidden print:grid grid-cols-3 gap-8 mt-20 text-center">
                                <div className="space-y-2">
                                    <div className="border-t border-black pt-2 px-2">
                                        <p className="font-bold text-xs uppercase">{pastorName || 'NOME DO PASTOR'}</p>
                                        <p className="text-[10px]">Pastor Presidente</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="border-t border-black pt-2 px-2">
                                        <p className="font-bold text-xs uppercase">{treasurerName || 'NOME DO TESOUREIRO'}</p>
                                        <p className="text-[10px]">Tesoureiro</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="border-t border-black pt-2 px-2">
                                        <p className="font-bold text-xs uppercase">{comissionName || 'COMISSÃO DE EXAME DE CONTAS'}</p>
                                        <p className="text-[10px]">Conselho Fiscal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuration for signatures (printable header details) */}
                    <Card className="print:hidden border-dashed">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-semibold">Configurar Assinaturas do Relatório</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Pastor Presidente</label>
                                <Input size={1} className="h-8 text-xs" value={pastorName} onChange={e => setPastorName(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Tesoureiro</label>
                                <Input size={1} className="h-8 text-xs" value={treasurerName} onChange={e => setTreasurerName(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Comissão de Contas</label>
                                <Input size={1} className="h-8 text-xs" value={comissionName} onChange={e => setComissionName(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}} />
        </div>
    );
}
