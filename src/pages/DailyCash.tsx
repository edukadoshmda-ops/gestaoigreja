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
  Loader2
} from 'lucide-react';

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
import { toast } from "sonner";

import { financialService, CreateFinancialTransactionDTO } from '@/services/financial.service';
import { cn } from '@/lib/utils';

// Categorias para Entradas
const INCOME_CATEGORIES = [
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
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form States
  const [amountStr, setAmountStr] = useState('');
  const [newTransaction, setNewTransaction] = useState<Partial<CreateFinancialTransactionDTO>>({
    type: 'entrada',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    description: ''
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['daily-cash', selectedDate],
    queryFn: async () => {
      const date = new Date(selectedDate);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      return financialService.list(adjustedDate, adjustedDate);
    }
  });

  const createMutation = useMutation({
    mutationFn: financialService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-cash'] });
      toast.success("Lançamento realizado com sucesso!");
      setIsAddModalOpen(false);
      setNewTransaction({
        type: 'entrada',
        date: selectedDate, // Mantém a data selecionada na view
        amount: 0,
        category: '',
        description: ''
      });
      setAmountStr('');
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao realizar lançamento.");
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
      toast.warning("Informe um valor válido.");
      return;
    }
    if (!newTransaction.category) {
      toast.warning("Informe uma categoria.");
      return;
    }

    createMutation.mutate(newTransaction as CreateFinancialTransactionDTO);
  };

  // Determinar quais categorias mostrar baseado no tipo selecionado
  const currentCategories = newTransaction.type === 'entrada' 
    ? INCOME_CATEGORIES 
    : EXPENSE_CATEGORIES;

  return (
    <div className="container mx-auto p-4 space-y-6 print:p-0 print:max-w-none">
      {/* Header & Controls - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa Diário</h1>
          <p className="text-muted-foreground">
            Gerenciamento de entradas e saídas do dia
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
                  Novo Lançamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Lançamento</DialogTitle>
                  <DialogDescription>
                    Adicione uma entrada ou saída no caixa.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
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
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input 
                        type="date" 
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input 
                      type="text" 
                      placeholder="R$ 0,00"
                      value={amountStr}
                      onChange={handleAmountChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select 
                        value={newTransaction.category} 
                        onValueChange={(val) => setNewTransaction({...newTransaction, category: val})}
                      >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currentCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição (Opcional)</Label>
                    <Textarea 
                      placeholder="Detalhes sobre o lançamento..."
                      value={newTransaction.description || ''}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar
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
        <h1 className="text-2xl font-bold">Relatório de Caixa Diário</h1>
        <p className="text-gray-600">
          Data: {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entradas
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.income)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Saídas
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.expense)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo do Dia
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              balance >= 0 ? "text-blue-600" : "text-red-600"
            )}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:hidden">
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent className="print:p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada para esta data.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.created_at), 'HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.description || 'Sem descrição'}
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
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
                        {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      transaction.type === 'entrada' ? "text-green-600" : "text-red-600"
                    )}>
                      {transaction.type === 'entrada' ? '+' : '-'} 
                      {formatCurrency(transaction.amount)}
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
