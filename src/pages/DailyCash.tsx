import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Printer,
  FileDown,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Plus,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { financialService, CreateFinancialTransactionDTO } from '@/services/financial.service';
import { cn } from '@/lib/utils';

// Categorias para Entradas
const INCOME_CATEGORIES = [
  "Saldo Anterior",
  "Dízimos",
  "Ofertas - Culto Geral",
  "Ofertas - Missões",
  "Ofertas - Construção",
  "Ofertas - Escola Bíblica",
  "Vendas - Cantina",
  "Vendas - Livraria/Bazar",
  "Inscrições de Eventos",
  "Doações Especiais",
  "Aluguéis/Uso de Espaço",
  "Outras Entradas"
];

// Categorias para Saídas
const EXPENSE_CATEGORIES = [
  "Manutenção Predial",
  "Limpeza e Zeladoria",
  "Energia Elétrica",
  "Água e Esgoto",
  "Internet / Telefone",
  "Gás de Cozinha",
  "Ajuda Social / Cestas Básicas",
  "Ministério Infantil",
  "Ministério de Jovens",
  "Ministério de Louvor",
  "Escola Bíblica",
  "Eventos",
  "Missões e Evangelismo",
  "Material de Escritório",
  "Material de Limpeza",
  "Combustível / Transporte",
  "Honorários / Prebendas",
  "Outras Saídas"
];

const DailyCash = () => {
  console.log('%c CAIXA DIARIO: COMPONENTE INVOCADO ', 'background: blue; color: white; font-weight: bold; padding: 5px;');

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [newTransaction, setNewTransaction] = useState<Partial<CreateFinancialTransactionDTO>>({
    type: 'entrada',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    description: ''
  });
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const createMutation = useMutation({
    mutationFn: (data: CreateFinancialTransactionDTO) => {
      if (!user?.churchId) throw new Error('Igreja não identificada.');
      return financialService.create(data, user.churchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-cash'] });
      toast({ title: "Lançamento realizado", description: "O lançamento foi registrado com sucesso." });
      setIsAddModalOpen(false);
      setNewTransaction({
        type: 'entrada',
        date: selectedDate,
        amount: 0,
        category: '',
        description: ''
      });
      setAmountStr('');
    },
    onError: (error) => {
      console.error(error);
      toast({ title: "Erro", description: "Erro ao realizar lançamento.", variant: "destructive" });
    }
  });
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['daily-cash', selectedDate],
    queryFn: async () => {
      console.log('DailyCash: Carregando dados para', selectedDate);
      if (!selectedDate) return [];
      const date = new Date(selectedDate + 'T12:00:00');
      if (isNaN(date.getTime())) return [];
      return await financialService.list(date, date);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-cash'] });
      toast({ title: "Lançamento removido", description: "O lançamento foi excluído com sucesso." });
    },
    onError: (error) => {
      console.error(error);
      toast({ title: "Erro", description: "Erro ao excluir lançamento.", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: CreateFinancialTransactionDTO }) => financialService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-cash'] });
      toast({ title: "Lançamento atualizado", description: "As alterações foram salvas com sucesso." });
      setIsAddModalOpen(false);
      setEditingTransaction(null);
    },
    onError: (error: any) => {
      console.error(error);
      toast({ title: "Erro", description: error.message || "Erro ao atualizar lançamento.", variant: "destructive" });
    }
  });

  const totals = transactions.reduce(
    (acc, curr) => {
      if (curr.type === 'entrada') {
        acc.income += curr.amount;
      } else {
        acc.expense += curr.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');

    if (numericValue === '') {
      setAmountStr('');
      setNewTransaction({ ...newTransaction, amount: 0 });
      return;
    }

    const floatValue = parseFloat(numericValue) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(floatValue);

    setAmountStr(formatted);
    setNewTransaction({ ...newTransaction, amount: floatValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.amount || newTransaction.amount <= 0) {
      toast({ title: "Valor inválido", description: "Informe um valor válido.", variant: "destructive" });
      return;
    }
    if (!newTransaction.category) {
      toast({ title: "Categoria faltando", description: "Informe uma categoria.", variant: "destructive" });
      return;
    }

    if (editingTransaction) {
      updateMutation.mutate({
        id: editingTransaction.id,
        data: newTransaction as CreateFinancialTransactionDTO
      });
    } else {
      createMutation.mutate(newTransaction as CreateFinancialTransactionDTO);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description
    });
    setAmountStr(formatCurrency(transaction.amount));
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      deleteMutation.mutate(id);
    }
  };

  const currentCategories = newTransaction.type === 'entrada'
    ? INCOME_CATEGORIES
    : EXPENSE_CATEGORIES;

  if (isLoading) {
    return (
      <div key="loading-state" className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <span>Erro ao carregar dados do caixa. Verifique as permissões.</span>
      </div>
    );
  }

  return (
    <div key="daily-cash-content" className="container mx-auto p-4 space-y-6 print:p-0 print:max-w-none" translate="no" >
      {/* Header & Controls - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div translate="no">
          <h1 className="text-3xl font-bold tracking-tight"><span>Caixa Diário</span></h1>
          <p className="text-muted-foreground">
            <span>Gerenciamento de entradas e saídas do dia</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48 w-full">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Novo Lançamento</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle><span>{editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</span></DialogTitle>
                  <DialogDescription>
                    <span>{editingTransaction ? 'Atualize os dados do lançamento.' : 'Adicione uma entrada ou saída no caixa.'}</span>
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4" translate="no">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label><span>Tipo</span></Label>
                      <Select
                        value={newTransaction.type}
                        onValueChange={(val: 'entrada' | 'saida') => {
                          setNewTransaction({
                            ...newTransaction,
                            type: val,
                            category: '' // Reset category when type changes
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada"><span>Entrada</span></SelectItem>
                          <SelectItem value="saida"><span>Saída</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label><span>Data</span></Label>
                      <Input
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label><span>Valor</span></Label>
                    <Input
                      type="text"
                      placeholder="R$ 0,00"
                      value={amountStr}
                      onChange={handleAmountChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label><span>Categoria</span></Label>
                    <Select
                      value={newTransaction.category}
                      onValueChange={(val) => setNewTransaction({ ...newTransaction, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currentCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            <span>{category}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label><span>Descrição (Opcional)</span></Label>
                    <Textarea
                      placeholder="Detalhes sobre o lançamento..."
                      value={newTransaction.description || ''}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingTransaction(null);
                    }}><span>Cancelar</span></Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <span>{editingTransaction ? 'Salvar Alterações' : 'Salvar'}</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint} title="Salvar como PDF">
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Print Header - Visible only on Print */}
      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold"><span>Relatório de Caixa Diário</span></h1>
        <p className="text-gray-600">
          <span>Data: {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3" translate="no">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span>Total Entradas</span>
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <span>{formatCurrency(totals.income)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span>Total Saídas</span>
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <span>{formatCurrency(totals.expense)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <span>Saldo do Dia</span>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              balance >= 0 ? "text-blue-600" : "text-red-600"
            )}>
              <span>{formatCurrency(balance)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:hidden">
          <CardTitle><span>Transações</span></CardTitle>
        </CardHeader>
        <CardContent className="print:p-0">
          <Table>
            <TableHeader translate="no">
              <TableRow>
                <TableHead><span>Horário</span></TableHead>
                <TableHead><span>Descrição</span></TableHead>
                <TableHead><span>Categoria</span></TableHead>
                <TableHead><span>Tipo</span></TableHead>
                <TableHead className="text-right"><span>Valor</span></TableHead>
                <TableHead className="text-right print:hidden"><span>Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <span>Nenhuma transação encontrada para esta data.</span>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <span>
                        {(() => {
                          try {
                            return transaction.created_at ? format(new Date(transaction.created_at), 'HH:mm') : '--:--';
                          } catch (e) {
                            console.error('Error formatting date:', transaction.created_at);
                            return '--:--';
                          }
                        })()}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span>{transaction.description || 'Sem descrição'}</span>
                    </TableCell>
                    <TableCell><span>{transaction.category}</span></TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.type === 'entrada' ? 'default' : 'destructive'}
                        className={cn(
                          transaction.type === 'entrada'
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100",
                          "print:border print:border-gray-300"
                        )}
                      >
                        <span>{transaction.type === 'entrada' ? 'Entrada' : 'Saída'}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      transaction.type === 'entrada' ? "text-green-600" : "text-red-600"
                    )}>
                      <span>{transaction.type === 'entrada' ? '+' : '-'}</span>
                      <span>{formatCurrency(transaction.amount)}</span>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <div className="flex justify-end gap-2 text-foreground">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)} className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)} className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 2cm; }
          /* Ensure the content takes full width */
          .container {
            max-width: none !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyCash;
