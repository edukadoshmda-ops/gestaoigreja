import { supabase } from '@/lib/supabaseClient';
import { financialService, Transaction, CreateFinancialTransactionDTO } from './financial.service';

/* =========================================================================
   TIPOS DA GESTÃO FINANCEIRA AVANÇADA
   ========================================================================= */

export type AccountType = 'corrente' | 'poupanca' | 'aplicacao' | 'cartao_credito' | 'caixa';
export type TransactionType = 'entrada' | 'saida' | 'transferencia';
export type TransactionStatus = 'realizado' | 'planejado';

export interface BankAccount {
  id: string;
  church_id: string;
  name: string;
  bank_name: string;
  account_type: AccountType;
  account_number?: string;
  initial_balance: number;
  balance_date: string; // Data do saldo inicial/real
  color: string;
  is_active: boolean;
  notes?: string;
}

export interface ChartCategory {
  id: string;
  code: string;
  name: string;
  type: 'receita' | 'despesa';
  group: string;
  description?: string;
  is_custom?: boolean;
}

export interface CostCenter {
  id: string;
  name: string;
  description?: string;
}

export interface AdminArea {
  id: string;
  name: string;
}

export interface FinancialTransactionExtended {
  id: string;
  church_id: string;
  type: TransactionType;
  status: TransactionStatus; // 'realizado' ou 'planejado'
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  cost_center?: string;
  admin_area?: string;
  account_id?: string;
  account_name?: string;
  destination_account_id?: string; // Para transferências
  destination_account_name?: string;
  description?: string | null;
  payment_method?: string;
  is_reconciled?: boolean; // Conciliação bancária
  receipt_url?: string | null;
  receipt_filename?: string | null;
  installment_current?: number;
  installment_total?: number;
  recurrent?: boolean;
  recurrent_frequency?: 'semanal' | 'mensal' | 'anual';
  parent_id?: string;
  created_at: string;
}

/* =========================================================================
   CONFIGURAÇÕES PADRÃO (PLANO DE CONTAS ECLESIÁSTICO & CENTROS DE CUSTO)
   ========================================================================= */

export const DEFAULT_CHART_CATEGORIES: ChartCategory[] = [
  // =========================================================================
  // 1. RECEITAS (1.01 a 1.53) - TOTAL: 53 CONTAS
  // =========================================================================

  // 1.1 Dízimos e Primícias
  { id: 'rec-01', code: '1.01', name: 'Dízimos', type: 'receita', group: 'Dízimos e Ofertas' },
  { id: 'rec-02', code: '1.02', name: 'Ofertas - Culto Geral', type: 'receita', group: 'Dízimos e Ofertas' },
  { id: 'rec-03', code: '1.03', name: 'Ofertas - Missões', type: 'receita', group: 'Dízimos e Ofertas' },
  { id: 'rec-04', code: '1.04', name: 'Ofertas - Construção & Reforma', type: 'receita', group: 'Dízimos e Ofertas' },
  { id: 'rec-05', code: '1.05', name: 'Ofertas - Escola Bíblica', type: 'receita', group: 'Dízimos e Ofertas' },
  { id: 'rec-06', code: '1.06', name: 'Vendas - Cantina', type: 'receita', group: 'Atividades Econômicas' },
  { id: 'rec-07', code: '1.07', name: 'Vendas - Livraria / Bazar', type: 'receita', group: 'Atividades Econômicas' },
  { id: 'rec-08', code: '1.08', name: 'Inscrições de Eventos / Retiros', type: 'receita', group: 'Eventos' },
  { id: 'rec-09', code: '1.09', name: 'Doações Especiais e Campanhas', type: 'receita', group: 'Doações' },
  { id: 'rec-10', code: '1.10', name: 'Rendimento de Aplicações', type: 'receita', group: 'Receitas Financeiras' },
  { id: 'rec-11', code: '1.11', name: 'Outras Entradas', type: 'receita', group: 'Outras Receitas' },

  // Dízimos Especializados e Frutos
  { id: 'rec-12', code: '1.12', name: 'Dízimos - PIX e Transferências Online', type: 'receita', group: 'Dízimos e Ofertas' },
  { id: 'rec-13', code: '1.13', name: 'Dízimos - Cartão Débito e Crédito', type: 'receita', group: 'Dízimos e Ofertas' },
  { id: 'rec-14', code: '1.14', name: 'Primícias e Primeiros Frutos', type: 'receita', group: 'Dízimos e Ofertas' },

  // Ofertas das Celebrações e Cultos
  { id: 'rec-15', code: '1.15', name: 'Ofertas de Domingo (Celebração da Família)', type: 'receita', group: 'Ofertas dos Cultos' },
  { id: 'rec-16', code: '1.16', name: 'Ofertas de Quarta-feira / Culto de Doutrina', type: 'receita', group: 'Ofertas dos Cultos' },
  { id: 'rec-17', code: '1.17', name: 'Ofertas de Vigílias e Reuniões de Oração', type: 'receita', group: 'Ofertas dos Cultos' },
  { id: 'rec-18', code: '1.18', name: 'Ofertas da Santa Ceia do Senhor', type: 'receita', group: 'Ofertas dos Cultos' },
  { id: 'rec-19', code: '1.19', name: 'Ofertas de Ação de Graças e Aniversários', type: 'receita', group: 'Ofertas dos Cultos' },
  { id: 'rec-20', code: '1.20', name: 'Ofertas Alçadas e Espontâneas', type: 'receita', group: 'Ofertas dos Cultos' },

  // Missões e Evangelismo
  { id: 'rec-21', code: '1.21', name: 'Ofertas Específicas de Missões Mundiais', type: 'receita', group: 'Missões e Ação Social' },
  { id: 'rec-22', code: '1.22', name: 'Ofertas de Missões Nacionais e Regionais', type: 'receita', group: 'Missões e Ação Social' },
  { id: 'rec-23', code: '1.23', name: 'Carnê e Mantenedores do Projeto Missionário', type: 'receita', group: 'Missões e Ação Social' },
  { id: 'rec-24', code: '1.24', name: 'Ofertas para Assistência e Ação Social Comunitária', type: 'receita', group: 'Missões e Ação Social' },
  { id: 'rec-25', code: '1.25', name: 'Adoção Missionária e Padrinhos de Obreiros', type: 'receita', group: 'Missões e Ação Social' },

  // Campanhas, Obras e Patrimônio
  { id: 'rec-26', code: '1.26', name: 'Ofertas Pró-Templo / Fundo de Construção', type: 'receita', group: 'Construção e Patrimônio' },
  { id: 'rec-27', code: '1.27', name: 'Campanhas Especiais (Tijolo, Cimento e Estrutura)', type: 'receita', group: 'Construção e Patrimônio' },
  { id: 'rec-28', code: '1.28', name: 'Carnê da Construção e Reformas', type: 'receita', group: 'Construção e Patrimônio' },
  { id: 'rec-29', code: '1.29', name: 'Venda de Bens Móveis / Imóveis Patrimoniais', type: 'receita', group: 'Construção e Patrimônio' },
  { id: 'rec-30', code: '1.30', name: 'Locação de Salões e Espaços da Igreja', type: 'receita', group: 'Construção e Patrimônio' },

  // Departamentos e Redes Ministeriais
  { id: 'rec-31', code: '1.31', name: 'Ofertas do Ministério Infantil (Kids)', type: 'receita', group: 'Departamentos e Redes' },
  { id: 'rec-32', code: '1.32', name: 'Ofertas do Ministério de Adolescentes (Teens)', type: 'receita', group: 'Departamentos e Redes' },
  { id: 'rec-33', code: '1.33', name: 'Ofertas do Ministério de Jovens', type: 'receita', group: 'Departamentos e Redes' },
  { id: 'rec-34', code: '1.34', name: 'Ofertas do Ministério de Mulheres', type: 'receita', group: 'Departamentos e Redes' },
  { id: 'rec-35', code: '1.35', name: 'Ofertas do Ministério de Homens', type: 'receita', group: 'Departamentos e Redes' },
  { id: 'rec-36', code: '1.36', name: 'Ofertas do Ministério da Melhor Idade (Seniores)', type: 'receita', group: 'Departamentos e Redes' },
  { id: 'rec-37', code: '1.37', name: 'Ofertas do Ministério de Casais e Família', type: 'receita', group: 'Departamentos e Redes' },
  { id: 'rec-38', code: '1.38', name: 'Ofertas do Ministério de Louvor, Som e Artes', type: 'receita', group: 'Departamentos e Redes' },

  // Eventos, Congressos e Retiros
  { id: 'rec-39', code: '1.39', name: 'Inscrições de Congressos e Conferências', type: 'receita', group: 'Eventos e Congressos' },
  { id: 'rec-40', code: '1.40', name: 'Inscrições de Retiros e Acampamentos', type: 'receita', group: 'Eventos e Congressos' },
  { id: 'rec-41', code: '1.41', name: 'Inscrições de Seminários e Workshops', type: 'receita', group: 'Eventos e Congressos' },
  { id: 'rec-42', code: '1.42', name: 'Inscrições de Encontro com Deus / Retiro Espiritual', type: 'receita', group: 'Eventos e Congressos' },
  { id: 'rec-43', code: '1.43', name: 'Venda de Kits, Camisetas e Crachás de Eventos', type: 'receita', group: 'Eventos e Congressos' },

  // Educação Cristã, Discipulado e Teologia
  { id: 'rec-44', code: '1.44', name: 'Ofertas da Escola Bíblica Dominical (EBD)', type: 'receita', group: 'Educação Teológica e Ensino' },
  { id: 'rec-45', code: '1.45', name: 'Mensalidades e Matrículas do Seminário / Instituto Bíblico', type: 'receita', group: 'Educação Teológica e Ensino' },
  { id: 'rec-46', code: '1.46', name: 'Taxas de Cursos de Formação de Líderes e Discipulado', type: 'receita', group: 'Educação Teológica e Ensino' },
  { id: 'rec-47', code: '1.47', name: 'Venda de Revistas, Manuais e Livros da EBD', type: 'receita', group: 'Educação Teológica e Ensino' },

  // Atividades Econômicas Auxiliares
  { id: 'rec-48', code: '1.48', name: 'Cantina da Igreja e Lanchonete', type: 'receita', group: 'Atividades Econômicas Auxiliares' },
  { id: 'rec-49', code: '1.49', name: 'Livraria Eclesiástica e Papelaria', type: 'receita', group: 'Atividades Econômicas Auxiliares' },
  { id: 'rec-50', code: '1.50', name: 'Bazar Beneficente e Brechó Solidário', type: 'receita', group: 'Atividades Econômicas Auxiliares' },
  { id: 'rec-51', code: '1.51', name: 'Estacionamento Próprio e Valet de Eventos', type: 'receita', group: 'Atividades Econômicas Auxiliares' },
  { id: 'rec-52', code: '1.52', name: 'Venda de Almoços, Feijoadas e Eventos Gastronômicos', type: 'receita', group: 'Atividades Econômicas Auxiliares' },

  // Repasses, Filiais e Doações Especiais
  { id: 'rec-53', code: '1.53', name: 'Repasse Estatutário de Congregações / Filiais para a Sede', type: 'receita', group: 'Repasses e Congregações' },

  // =========================================================================
  // 2. DESPESAS (2.01 a 2.100) - TOTAL: 100 CONTAS
  // =========================================================================

  // Padrões originais mantidos para total compatibilidade
  { id: 'desp-01', code: '2.01', name: 'Prebendas e Honorários Pastorais', type: 'despesa', group: 'Pessoal e Ministério' },
  { id: 'desp-02', code: '2.02', name: 'Encargos / Ajuda de Custo', type: 'despesa', group: 'Pessoal e Ministério' },
  { id: 'desp-03', code: '2.03', name: 'Energia Elétrica', type: 'despesa', group: 'Utilidades e Manutenção' },
  { id: 'desp-04', code: '2.04', name: 'Água e Saneamento', type: 'despesa', group: 'Utilidades e Manutenção' },
  { id: 'desp-05', code: '2.05', name: 'Internet e Telefonia', type: 'despesa', group: 'Utilidades e Manutenção' },
  { id: 'desp-06', code: '2.06', name: 'Manutenção Predial e Reformas', type: 'despesa', group: 'Utilidades e Manutenção' },
  { id: 'desp-07', code: '2.07', name: 'Limpeza e Descartáveis', type: 'despesa', group: 'Utilidades e Manutenção' },
  { id: 'desp-08', code: '2.08', name: 'Aluguel do Templo', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-09', code: '2.09', name: 'Ministério Infantil (Kids)', type: 'despesa', group: 'Departamentos' },
  { id: 'desp-10', code: '2.10', name: 'Ministério de Louvor e Mídia', type: 'despesa', group: 'Departamentos' },
  { id: 'desp-11', code: '2.11', name: 'Ministério de Jovens e Adolescentes', type: 'despesa', group: 'Departamentos' },
  { id: 'desp-12', code: '2.12', name: 'Escola Bíblica Dominical', type: 'despesa', group: 'Departamentos' },
  { id: 'desp-13', code: '2.13', name: 'Missões e Ação Social', type: 'despesa', group: 'Missões e Social' },
  { id: 'desp-14', code: '2.14', name: 'Cestas Básicas e Beneficência', type: 'despesa', group: 'Missões e Social' },
  { id: 'desp-15', code: '2.15', name: 'Combustível e Transporte', type: 'despesa', group: 'Transporte e Logística' },
  { id: 'desp-16', code: '2.16', name: 'Material de Escritório / Gráfica', type: 'despesa', group: 'Administrativo' },
  { id: 'desp-17', code: '2.17', name: 'Tarifas Bancárias e Taxas PIX/Cartão', type: 'despesa', group: 'Despesas Financeiras' },
  { id: 'desp-18', code: '2.18', name: 'Eventos e Congressos', type: 'despesa', group: 'Eventos' },
  { id: 'desp-19', code: '2.19', name: 'Outras Saídas', type: 'despesa', group: 'Outras Despesas' },

  // Pessoal Ministerial Detalhado
  { id: 'desp-20', code: '2.20', name: 'Prebendas e Sustento do Pastor Titular / Presidente', type: 'despesa', group: 'Pessoal Ministerial' },
  { id: 'desp-21', code: '2.21', name: 'Prebendas e Honorários de Pastores Auxiliares', type: 'despesa', group: 'Pessoal Ministerial' },
  { id: 'desp-22', code: '2.22', name: 'Sustento de Diáconos, Presbíteros e Líderes Locais', type: 'despesa', group: 'Pessoal Ministerial' },
  { id: 'desp-23', code: '2.23', name: 'Plano de Saúde e Assistência Médica Pastoral', type: 'despesa', group: 'Pessoal Ministerial' },
  { id: 'desp-24', code: '2.24', name: 'Previdência Social (INSS) dos Ministros Religiosos', type: 'despesa', group: 'Pessoal Ministerial' },
  { id: 'desp-25', code: '2.25', name: 'Moradia Pastoral / Aluguel da Residência Pastoral', type: 'despesa', group: 'Pessoal Ministerial' },
  { id: 'desp-26', code: '2.26', name: 'Gratificação Anual e Férias Ministeriais', type: 'despesa', group: 'Pessoal Ministerial' },

  // Recursos Humanos e Funcionários CLT
  { id: 'desp-27', code: '2.27', name: 'Salários de Zeladoria, Limpeza e Portaria (CLT)', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-28', code: '2.28', name: 'Salários de Secretaria, Recepção e Administrativo (CLT)', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-29', code: '2.29', name: 'Salários de Técnicos de Som, TI e Transmissão (CLT)', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-30', code: '2.30', name: '13º Salário e Férias de Empregados (CLT)', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-31', code: '2.31', name: 'FGTS e Encargos Trabalhistas Governamentais', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-32', code: '2.32', name: 'INSS Patronal e Guias da Folha de Pagamento', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-33', code: '2.33', name: 'Vale Transporte e Vale Alimentação de Funcionários', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-34', code: '2.34', name: 'Exames Ocupacionais (PCMSO / PGR / LTCAT / ASO)', type: 'despesa', group: 'Recursos Humanos CLT' },
  { id: 'desp-35', code: '2.35', name: 'Serviços Terceirizados de Vigilância e Segurança Armada', type: 'despesa', group: 'Recursos Humanos CLT' },

  // Imóveis, Templos e Instalações
  { id: 'desp-36', code: '2.36', name: 'Aluguel de Congregações e Pontos de Pregação', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-37', code: '2.37', name: 'Aluguel de Garagem e Estacionamento Anexo', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-38', code: '2.38', name: 'IPTU, Taxas Municipais e Alvarás de Funcionamento', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-39', code: '2.39', name: 'Energia Elétrica - Congregações e Espaços Anexos', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-40', code: '2.40', name: 'Pintura, Telhado, Calhas e Impermeabilização Predial', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-41', code: '2.41', name: 'Manutenção de Ar-Condicionado e Sistema de Climatização', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-42', code: '2.42', name: 'Segurança Eletrônica, Alarmes e Câmeras CFTV', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-43', code: '2.43', name: 'Dedetização, Controle de Pragas e Limpeza de Caixas d’Água', type: 'despesa', group: 'Imóveis e Estrutura' },
  { id: 'desp-44', code: '2.44', name: 'Seguro Contra Incêndio e Responsabilidade Civil do Templo', type: 'despesa', group: 'Imóveis e Estrutura' },

  // Tecnologia, Som, Vídeo e Transmissão
  { id: 'desp-45', code: '2.45', name: 'Aquisição de Instrumentos Musicais (Teclados, Bateria, Violão)', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-46', code: '2.46', name: 'Manutenção de Instrumentos Musicais e Amplificadores', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-47', code: '2.47', name: 'Microfones, Cabos, Conectores e Caixas de Som', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-48', code: '2.48', name: 'Equipamentos de Vídeo, Câmeras PTZ e Painéis de LED', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-49', code: '2.49', name: 'Softwares de Transmissão e Projeção (Holyrics, vMix, ProPresenter)', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-50', code: '2.50', name: 'Hospedagem de Site, E-mails e Servidores Cloud', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-51', code: '2.51', name: 'Link de Internet Fibra Dedicada e Redes Wi-Fi do Templo', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-52', code: '2.52', name: 'Tráfego Pago, Anúncios Online e Redes Sociais da Igreja', type: 'despesa', group: 'Tecnologia, Mídia e Som' },
  { id: 'desp-53', code: '2.53', name: 'Equipamentos de Iluminação Cênica, Canhões e Mesas DMX', type: 'despesa', group: 'Tecnologia, Mídia e Som' },

  // Departamentos e Redes Ministeriais
  { id: 'desp-54', code: '2.54', name: 'Ministério Infantil: Materiais Pedagógicos e Didáticos', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-55', code: '2.55', name: 'Ministério Infantil: Lanches e Alimentação das Crianças', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-56', code: '2.56', name: 'Ministério Infantil: Brinquedos, Berçário e Decoração', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-57', code: '2.57', name: 'Ministério de Adolescentes (Teens): Materiais e Retiros', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-58', code: '2.58', name: 'Ministério de Jovens: Conexões, Retiros e Projetos', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-59', code: '2.59', name: 'Ministério de Mulheres: Chás, Encontros e Confraternizações', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-60', code: '2.60', name: 'Ministério de Homens: Café da Manhã e Palestras', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-61', code: '2.61', name: 'Ministério de Casais: Jantares, Cursos Familiares e Apostilas', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-62', code: '2.62', name: 'Ministério da Melhor Idade: Atividades e Passeios', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-63', code: '2.63', name: 'Ministério de Teatro, Dança e Coreografia: Figurinos', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-64', code: '2.64', name: 'Coral e Orquestra: Uniformes e Partituras Musicais', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-65', code: '2.65', name: 'Células / Pequenos Grupos: Manuais e Dinâmicas de Estudo', type: 'despesa', group: 'Departamentos e Redes' },
  { id: 'desp-66', code: '2.66', name: 'Recepção, Integração e Boas-Vindas aos Novos Membros', type: 'despesa', group: 'Departamentos e Redes' },

  // Missões, Sustento e Ação Social
  { id: 'desp-67', code: '2.67', name: 'Sustento Direto de Missionários no Campo Transcultural', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-68', code: '2.68', name: 'Sustento de Missionários Nacionais, Indígenas e Ribeirinhos', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-69', code: '2.69', name: 'Repasses Estatutários para Junta ou Agência Missionária', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-70', code: '2.70', name: 'Aquisição de Bíblias, Folhetos e Literatura Evangelística', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-71', code: '2.71', name: 'Viagens Missionárias, Combustível e Hospedagem de Obreiros', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-72', code: '2.72', name: 'Fundo de Benevolência e Auxílio Emergencial a Famílias Carentes', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-73', code: '2.73', name: 'Medicamentos, Óculos e Cuidados de Saúde para Assistidos', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-74', code: '2.74', name: 'Sopão Comunitário e Distribuição de Cobertores / Agasalhos', type: 'despesa', group: 'Missões e Ação Social' },
  { id: 'desp-75', code: '2.75', name: 'Cursos Profissionalizantes Comunitários e Inclusão Social', type: 'despesa', group: 'Missões e Ação Social' },

  // Construção, Ampliação e Patrimônio
  { id: 'desp-76', code: '2.76', name: 'Aquisição de Terrenos e Imóveis para Novos Templos', type: 'despesa', group: 'Construção e Patrimônio' },
  { id: 'desp-77', code: '2.77', name: 'Materiais de Construção Pesada (Cimento, Ferro, Areia, Blocos)', type: 'despesa', group: 'Construção e Patrimônio' },
  { id: 'desp-78', code: '2.78', name: 'Materiais de Acabamento (Pisos, Revestimentos, Louças, Vidros)', type: 'despesa', group: 'Construção e Patrimônio' },
  { id: 'desp-79', code: '2.79', name: 'Mão de Obra de Engenharia, Empreiteiras e Pedreiros', type: 'despesa', group: 'Construção e Patrimônio' },
  { id: 'desp-80', code: '2.80', name: 'Plantas, Projetos Arquitetônicos, AVCB e Legalização Predial', type: 'despesa', group: 'Construção e Patrimônio' },
  { id: 'desp-81', code: '2.81', name: 'Mobiliário: Cadeiras, Longarinas, Púlpitos e Mesas do Templo', type: 'despesa', group: 'Construção e Patrimônio' },
  { id: 'desp-82', code: '2.82', name: 'Mobiliário de Escritório, Armários e Computadores', type: 'despesa', group: 'Construção e Patrimônio' },
  { id: 'desp-83', code: '2.83', name: 'Aquisição de Veículos da Igreja (Van, Ônibus, Utilitários)', type: 'despesa', group: 'Construção e Patrimônio' },

  // Transporte, Combustível e Frota
  { id: 'desp-84', code: '2.84', name: 'Manutenção Mecânica, Pneus e Revisão de Veículos da Frota', type: 'despesa', group: 'Transporte e Frota' },
  { id: 'desp-85', code: '2.85', name: 'IPVA, Licenciamento e Seguro Obrigatório dos Veículos', type: 'despesa', group: 'Transporte e Frota' },
  { id: 'desp-86', code: '2.86', name: 'Locação de Ônibus e Vans para Viagens e Retiros', type: 'despesa', group: 'Transporte e Frota' },
  { id: 'desp-87', code: '2.87', name: 'Passagens Aéreas e Terrestres para Preletores Convidados', type: 'despesa', group: 'Transporte e Frota' },
  { id: 'desp-88', code: '2.88', name: 'Hospedagem e Diárias em Hotéis para Preletores Convidados', type: 'despesa', group: 'Transporte e Frota' },

  // Administrativo, Secretaria e Governança
  { id: 'desp-89', code: '2.89', name: 'Despesas Postais (Correios) e Malotes entre Sedes', type: 'despesa', group: 'Administrativo e Secretaria' },
  { id: 'desp-90', code: '2.90', name: 'Despesas Cartorárias, Registro de Atas e Procurações', type: 'despesa', group: 'Administrativo e Secretaria' },
  { id: 'desp-91', code: '2.91', name: 'Honorários de Assessoria Contábil e Auditoria Independente', type: 'despesa', group: 'Administrativo e Secretaria' },
  { id: 'desp-92', code: '2.92', name: 'Assessoria Jurídica, Advogados e Custas Processuais', type: 'despesa', group: 'Administrativo e Secretaria' },
  { id: 'desp-93', code: '2.93', name: 'Assinaturas de Software ERP e Licenças de Informática', type: 'despesa', group: 'Administrativo e Secretaria' },
  { id: 'desp-94', code: '2.94', name: 'Telefonia Móvel Corporativa e Comunicação Interna', type: 'despesa', group: 'Administrativo e Secretaria' },
  { id: 'desp-95', code: '2.95', name: 'Café, Açúcar, Chá e Copa da Secretaria e Recepção', type: 'despesa', group: 'Administrativo e Secretaria' },
  { id: 'desp-96', code: '2.96', name: 'Anuidade da Convenção Geral, Confrades e Órgãos Eclesiásticos', type: 'despesa', group: 'Administrativo e Secretaria' },

  // Eventos, Celebrações e Liturgia
  { id: 'desp-97', code: '2.97', name: 'Locação de Sítios, Hotéis e Chácaras para Retiros Espirituais', type: 'despesa', group: 'Eventos e Liturgia' },
  { id: 'desp-98', code: '2.98', name: 'Decoração Floral, Cenários e Ambientação de Festividades', type: 'despesa', group: 'Eventos e Liturgia' },
  { id: 'desp-99', code: '2.99', name: 'Elementos da Santa Ceia (Pão, Suco de Uva, Cálices Descartáveis)', type: 'despesa', group: 'Eventos e Liturgia' },
  { id: 'desp-100', code: '2.100', name: 'Juros, Multas Moratórias e Encargos Financeiros', type: 'despesa', group: 'Despesas Financeiras' },
];

export const DEFAULT_COST_CENTROS: CostCenter[] = [
  { id: 'cc-01', name: 'Culto Geral / Celebrações Oficiais', description: 'Celebrações dominicais, cultos regulares e liturgia geral' },
  { id: 'cc-02', name: 'Missões Transculturais & Evangelismo', description: 'Sustento missionário, agências e cruzadas evangelísticas' },
  { id: 'cc-03', name: 'Escola Bíblica Dominical (EBD) & Discipulado', description: 'Ensino bíblico, formação cristã e materiais didáticos' },
  { id: 'cc-04', name: 'Ministério Infantil (Kids)', description: 'Crianças, berçário, cultos infantis e congressos kids' },
  { id: 'cc-05', name: 'Ministério de Adolescentes (Teens)', description: 'Adolescentes, reuniões de sábado e acampamentos' },
  { id: 'cc-06', name: 'Ministério de Jovens', description: 'Juventude, congressos de jovens e conferências' },
  { id: 'cc-07', name: 'Ministério de Casais & Família', description: 'Encontros de casais, jantares e cursos para pais e família' },
  { id: 'cc-08', name: 'Ministério de Mulheres', description: 'Chás de mulheres, congressos e círculos de oração' },
  { id: 'cc-09', name: 'Ministério de Homens', description: 'Cafés de homens, vigílias e conferências masculinas' },
  { id: 'cc-10', name: 'Louvor, Som, Iluminação & Multimídia', description: 'Banda, instrumentos, acústica, sonorização e técnica' },
  { id: 'cc-11', name: 'Comunicação, Mídia & Transmissão', description: 'Transmissão ao vivo, redes sociais, fotos e design' },
  { id: 'cc-12', name: 'Ação Social & Beneficência Comunitária', description: 'Cestas básicas, sopão, remédios e assistência social' },
  { id: 'cc-13', name: 'Construção, Obras & Patrimônio', description: 'Edificações, reformas de templos, ampliação e terrenos' },
  { id: 'cc-14', name: 'Administração Geral, Secretaria & Jurídico', description: 'Secretaria, contabilidade, cartório e gestão executiva' },
  { id: 'cc-15', name: 'Cantina, Livraria & Atividades Auxiliares', description: 'Cantina dos cultos, bazar, livraria e alimentação' },
  { id: 'cc-16', name: 'Transporte, Frota & Logística', description: 'Veículos da igreja, vans, combustível e transporte de membros' },
  { id: 'cc-17', name: 'Eventos Gerais, Congressos & Retiros', description: 'Grandes conferências, retiros espirituais e acampamentos' },
  { id: 'cc-18', name: 'Seminário Teológico & Instituto Bíblico', description: 'Cursos teológicos avançados e formação pastoral' },
  { id: 'cc-19', name: 'Congregação / Filial 01 (Zona Norte)', description: 'Custos e receitas da subsede ou congregação 01' },
  { id: 'cc-20', name: 'Congregação / Filial 02 (Zona Sul)', description: 'Custos e receitas da subsede ou congregação 02' },
];

export const DEFAULT_ADMIN_AREAS: AdminArea[] = [
  { id: 'area-01', name: 'Pastoral Sênior & Presidência' },
  { id: 'area-02', name: 'Tesouraria Geral & Finanças' },
  { id: 'area-03', name: 'Secretaria Executiva & Membresia' },
  { id: 'area-04', name: 'Patrimônio, Infraestrutura & Zeladoria' },
  { id: 'area-05', name: 'Comunicação, Mídia & Marketing' },
  { id: 'area-06', name: 'Conselho Fiscal & Auditoria' },
  { id: 'area-07', name: 'Conselho Pastoral & Ministérios' },
  { id: 'area-08', name: 'Departamento Jurídico & Compliance' },
  { id: 'area-09', name: 'Coordenação de Congregações & Setores' },
];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'conta-caixa',
    church_id: '',
    name: 'Caixa Geral (Dinheiro em Espécie)',
    bank_name: 'Caixa Físico',
    account_type: 'caixa',
    account_number: 'N/A',
    initial_balance: 0,
    balance_date: new Date().toISOString().split('T')[0],
    color: '#10B981',
    is_active: true,
  },
  {
    id: 'conta-banco-principal',
    church_id: '',
    name: 'Conta Corrente Principal',
    bank_name: 'Banco do Brasil',
    account_type: 'corrente',
    account_number: 'Ag: 1234 / CC: 56789-0',
    initial_balance: 0,
    balance_date: new Date().toISOString().split('T')[0],
    color: '#3B82F6',
    is_active: true,
  },
  {
    id: 'conta-poupanca-reforma',
    church_id: '',
    name: 'Poupança / Fundo de Reserva',
    bank_name: 'Caixa Econômica',
    account_type: 'poupanca',
    account_number: 'Ag: 1234 / CP: 9988-1',
    initial_balance: 0,
    balance_date: new Date().toISOString().split('T')[0],
    color: '#8B5CF6',
    is_active: true,
  }
];

/* =========================================================================
   STORAGE HELPERS (PERSISTÊNCIA HÍBRIDA MULTI-TENANT)
   ========================================================================= */

const STORAGE_KEYS = {
  ACCOUNTS: (churchId: string) => `church_${churchId}_finance_accounts`,
  CHART: (churchId: string) => `church_${churchId}_finance_chart`,
  TRANSACTIONS_META: (churchId: string) => `church_${churchId}_finance_tx_meta`,
  SIMULATIONS: (churchId: string) => `church_${churchId}_finance_simulations`,
};

const memoryStorage = new Map<string, string>();

function getLocalData<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    }
    const mem = memoryStorage.get(key);
    if (!mem) return fallback;
    return JSON.parse(mem);
  } catch (err) {
    console.warn(`Erro ao ler ${key}:`, err);
    return fallback;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    } else {
      memoryStorage.set(key, serialized);
    }
  } catch (err) {
    console.warn(`Erro ao gravar ${key}:`, err);
  }
}

/* =========================================================================
   SERVIÇO PRINCIPAL DE GESTÃO FINANCEIRA
   ========================================================================= */

export const financialManagementService = {
  // 1. CONTAS BANCÁRIAS
  getAccounts(churchId: string): BankAccount[] {
    const key = STORAGE_KEYS.ACCOUNTS(churchId);
    const existing = getLocalData<BankAccount[]>(key, []);
    if (!existing || existing.length === 0) {
      const initial = DEFAULT_BANK_ACCOUNTS.map(a => ({ ...a, church_id: churchId }));
      setLocalData(key, initial);
      return initial.map(a => ({ ...a }));
    }
    return existing.map(a => ({ ...a }));
  },

  saveAccount(churchId: string, account: Partial<BankAccount> & { name: string }): BankAccount {
    const accounts = this.getAccounts(churchId);
    if (account.id) {
      const idx = accounts.findIndex(a => a.id === account.id);
      if (idx !== -1) {
        accounts[idx] = { ...accounts[idx], ...account } as BankAccount;
      }
    } else {
      const newAcc: BankAccount = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        church_id: churchId,
        name: account.name,
        bank_name: account.bank_name || 'Geral',
        account_type: account.account_type || 'corrente',
        account_number: account.account_number || '',
        initial_balance: Number(account.initial_balance) || 0,
        balance_date: account.balance_date || new Date().toISOString().split('T')[0],
        color: account.color || '#3B82F6',
        is_active: account.is_active !== false,
        notes: account.notes || '',
      };
      accounts.push(newAcc);
    }
    setLocalData(STORAGE_KEYS.ACCOUNTS(churchId), accounts);
    return accounts.find(a => a.name === account.name) || accounts[0];
  },

  deleteAccount(churchId: string, accountId: string): void {
    const accounts = this.getAccounts(churchId).filter(a => a.id !== accountId);
    setLocalData(STORAGE_KEYS.ACCOUNTS(churchId), accounts);
  },

  // 2. PLANO DE CONTAS
  getChartOfAccounts(churchId: string): ChartCategory[] {
    const key = STORAGE_KEYS.CHART(churchId);
    const existing = getLocalData<ChartCategory[]>(key, []);
    if (!existing || existing.length === 0) {
      const cloned = DEFAULT_CHART_CATEGORIES.map(c => ({ ...c }));
      setLocalData(key, cloned);
      return cloned;
    }

    // Mesclagem inteligente: se já existem categorias no localStorage,
    // adiciona todas as novas categorias padrão que não estejam salvas,
    // preservando qualquer categoria personalizada criada pelo usuário.
    const existingCodes = new Set(existing.map(c => c.code?.trim()));
    const existingNames = new Set(existing.map(c => c.name?.trim().toLowerCase()));

    const missingDefaults = DEFAULT_CHART_CATEGORIES.filter(
      defCat => !existingCodes.has(defCat.code?.trim()) && !existingNames.has(defCat.name?.trim().toLowerCase())
    );

    if (missingDefaults.length > 0) {
      const merged = [...existing, ...missingDefaults.map(c => ({ ...c }))];
      merged.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'receita' ? -1 : 1;
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });
      setLocalData(key, merged);
      return merged;
    }

    return existing.map(c => ({ ...c }));
  },

  saveChartCategory(churchId: string, category: Partial<ChartCategory> & { name: string; type: 'receita' | 'despesa' }): ChartCategory {
    const list = this.getChartOfAccounts(churchId);
    if (category.id) {
      const idx = list.findIndex(c => c.id === category.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...category } as ChartCategory;
      }
    } else {
      const nextCode = category.type === 'receita' 
        ? `1.${(list.filter(c => c.type === 'receita').length + 1).toString().padStart(2, '0')}`
        : `2.${(list.filter(c => c.type === 'despesa').length + 1).toString().padStart(2, '0')}`;
      const newCat: ChartCategory = {
        id: `cat-${Date.now()}`,
        code: category.code || nextCode,
        name: category.name,
        type: category.type,
        group: category.group || (category.type === 'receita' ? 'Outras Receitas' : 'Outras Despesas'),
        description: category.description || '',
        is_custom: true
      };
      list.push(newCat);
    }
    setLocalData(STORAGE_KEYS.CHART(churchId), list);
    return list.find(c => c.name === category.name) || list[0];
  },

  deleteChartCategory(churchId: string, categoryId: string): void {
    const list = this.getChartOfAccounts(churchId).filter(c => c.id !== categoryId);
    setLocalData(STORAGE_KEYS.CHART(churchId), list);
  },

  importChartOfAccounts(churchId: string, categories: ChartCategory[]): void {
    setLocalData(STORAGE_KEYS.CHART(churchId), categories);
  },

  resetChartOfAccounts(churchId: string): void {
    setLocalData(STORAGE_KEYS.CHART(churchId), DEFAULT_CHART_CATEGORIES);
  },

  // 3. TRANSAÇÕES ESTENDIDAS (INTEGRAÇÃO COM SUPABASE E METADADOS)
  async getAllExtendedTransactions(churchId: string): Promise<FinancialTransactionExtended[]> {
    const metaMap = getLocalData<Record<string, Partial<FinancialTransactionExtended>>>(
      STORAGE_KEYS.TRANSACTIONS_META(churchId),
      {}
    );

    // Buscar transações base do Supabase
    let baseList: Transaction[] = [];
    try {
      baseList = await financialService.list(undefined, undefined, churchId);
    } catch (err) {
      console.warn('Erro ao carregar do Supabase:', err);
    }

    // Mesclar com metadados estendidos
    const merged: FinancialTransactionExtended[] = baseList.map(base => {
      const meta = metaMap[base.id] || {};
      return {
        id: base.id,
        church_id: churchId,
        type: (meta.type || base.type) as TransactionType,
        status: meta.status || 'realizado',
        amount: Number(base.amount) || 0,
        date: base.date,
        category: base.category,
        cost_center: meta.cost_center || 'Culto Geral / Eclesiástico',
        admin_area: meta.admin_area || 'Tesouraria & Finanças',
        account_id: meta.account_id || 'conta-caixa',
        account_name: meta.account_name || 'Caixa Geral (Dinheiro em Espécie)',
        destination_account_id: meta.destination_account_id,
        destination_account_name: meta.destination_account_name,
        description: base.description,
        payment_method: meta.payment_method || 'Dinheiro / PIX',
        is_reconciled: meta.is_reconciled ?? true,
        receipt_url: meta.receipt_url || (base as any).receipt_url,
        receipt_filename: meta.receipt_filename || base.receipt_filename || null,
        installment_current: meta.installment_current,
        installment_total: meta.installment_total,
        recurrent: meta.recurrent,
        recurrent_frequency: meta.recurrent_frequency,
        parent_id: meta.parent_id,
        created_at: base.created_at || new Date().toISOString(),
      };
    });

    // Incluir transações planejadas puramente locais (simulações futuras que não foram ao banco ainda)
    const localOnly = Object.values(metaMap).filter(m => m.id?.startsWith('local-plan-')) as FinancialTransactionExtended[];
    return [...merged, ...localOnly].sort((a, b) => b.date.localeCompare(a.date));
  },

  async createTransaction(
    churchId: string,
    tx: {
      type: TransactionType;
      status?: TransactionStatus;
      amount: number;
      date: string;
      category: string;
      cost_center?: string;
      admin_area?: string;
      account_id?: string;
      destination_account_id?: string;
      description?: string;
      payment_method?: string;
      receipt_url?: string | null;
      receipt_filename?: string | null;
      requireRemote?: boolean;
      installments?: number; // Para parcelamento
      recurrent?: boolean;
      recurrent_frequency?: 'semanal' | 'mensal' | 'anual';
      recurrent_times?: number;
    }
  ): Promise<string[]> {
    const accounts = this.getAccounts(churchId);
    const originAcc = (tx.account_id ? accounts.find(a => a.id === tx.account_id) : undefined) || accounts[0] || {
      id: 'conta-caixa',
      church_id: churchId,
      name: 'Caixa Geral (Dinheiro em Espécie)',
      bank_name: 'Caixa Físico',
      account_type: 'caixa',
      initial_balance: 0,
      balance_date: '',
      color: '#10B981',
      is_active: true,
    };
    const destAcc = tx.destination_account_id ? accounts.find(a => a.id === tx.destination_account_id) : undefined;
    const metaMap = getLocalData<Record<string, Partial<FinancialTransactionExtended>>>(
      STORAGE_KEYS.TRANSACTIONS_META(churchId),
      {}
    );

    // Se for parcelado ou recorrente, gerar a série
    const numItems = tx.installments && tx.installments > 1 
      ? tx.installments 
      : (tx.recurrent && tx.recurrent_times ? tx.recurrent_times : 1);

    const baseDate = new Date(tx.date + 'T12:00:00');
    const createdIds: string[] = [];

    for (let i = 0; i < numItems; i++) {
      const itemDate = new Date(baseDate);
      if (tx.recurrent_frequency === 'semanal') {
        itemDate.setDate(baseDate.getDate() + (i * 7));
      } else if (tx.recurrent_frequency === 'anual') {
        itemDate.setFullYear(baseDate.getFullYear() + i);
      } else {
        // Mensal (padrão para parcelas e recorrência mensal)
        itemDate.setMonth(baseDate.getMonth() + i);
      }
      const dateStr = itemDate.toISOString().split('T')[0];

      let desc = tx.description || '';
      if (tx.installments && tx.installments > 1) {
        desc = `${desc} (${i + 1}/${tx.installments})`.trim();
      }

      // Se for apenas planejado para o futuro (parcelas futuras), ou se o usuário escolheu explicitamente planejado
      const isPlanned = tx.status === 'planejado' || (i > 0 && itemDate > new Date());

      if (tx.type === 'transferencia') {
        // Transferência cria duas movimentações ou um registro vinculado
        const transferDesc = `Transf. de ${originAcc.name} para ${destAcc?.name || 'Conta Destino'}: ${desc}`;
        
        // Registrar Saída da conta de origem no Supabase
        const createdSaida = await financialService.create({
          type: 'saida',
          category: 'Transferência entre Contas',
          amount: tx.amount,
          date: dateStr,
          description: transferDesc,
          requireRemote: tx.requireRemote,
        }, churchId);
        createdIds.push(createdSaida.id);

        metaMap[createdSaida.id] = {
          type: 'transferencia',
          status: isPlanned ? 'planejado' : 'realizado',
          account_id: originAcc.id,
          account_name: originAcc.name,
          destination_account_id: destAcc?.id,
          destination_account_name: destAcc?.name,
          cost_center: tx.cost_center,
          admin_area: tx.admin_area,
          payment_method: 'Transferência Bancária',
          is_reconciled: true,
        };

        // Registrar Entrada na conta destino no Supabase
        const createdEntrada = await financialService.create({
          type: 'entrada',
          category: 'Transferência entre Contas',
          amount: tx.amount,
          date: dateStr,
          description: `Recebido via transf. de ${originAcc.name}: ${desc}`,
          requireRemote: tx.requireRemote,
        }, churchId);
        createdIds.push(createdEntrada.id);

        metaMap[createdEntrada.id] = {
          type: 'transferencia',
          status: isPlanned ? 'planejado' : 'realizado',
          account_id: destAcc?.id || originAcc.id,
          account_name: destAcc?.name || originAcc.name,
          cost_center: tx.cost_center,
          admin_area: tx.admin_area,
          payment_method: 'Transferência Bancária',
          is_reconciled: true,
        };

      } else {
        // Lançamento normal de Entrada ou Saída
        const created = await financialService.create({
          type: tx.type,
          category: tx.category,
          amount: tx.amount,
          date: dateStr,
          description: desc,
          requireRemote: tx.requireRemote,
        }, churchId);
        createdIds.push(created.id);

        metaMap[created.id] = {
          type: tx.type,
          status: isPlanned ? 'planejado' : 'realizado',
          account_id: originAcc.id,
          account_name: originAcc.name,
          cost_center: tx.cost_center || 'Culto Geral / Eclesiástico',
          admin_area: tx.admin_area || 'Tesouraria & Finanças',
          payment_method: tx.payment_method || 'PIX',
          receipt_url: created.receipt_url || tx.receipt_url,
          receipt_filename: created.receipt_filename || tx.receipt_filename,
          installment_current: tx.installments && tx.installments > 1 ? i + 1 : undefined,
          installment_total: tx.installments && tx.installments > 1 ? tx.installments : undefined,
          recurrent: tx.recurrent,
          recurrent_frequency: tx.recurrent_frequency,
          is_reconciled: !isPlanned,
        };
      }
    }

    setLocalData(STORAGE_KEYS.TRANSACTIONS_META(churchId), metaMap);
    return createdIds;
  },

  async deleteTransaction(churchId: string, id: string): Promise<void> {
    const metaMap = getLocalData<Record<string, any>>(STORAGE_KEYS.TRANSACTIONS_META(churchId), {});
    delete metaMap[id];
    setLocalData(STORAGE_KEYS.TRANSACTIONS_META(churchId), metaMap);

    if (!id.startsWith('local-plan-')) {
      await financialService.delete(id);
    }
  },

  async updateTransaction(
    churchId: string,
    id: string,
    updates: {
      type?: TransactionType;
      status?: TransactionStatus;
      amount?: number;
      date?: string;
      category?: string;
      cost_center?: string;
      admin_area?: string;
      account_id?: string;
      account_name?: string;
      description?: string;
      payment_method?: string;
      receipt_url?: string | null;
      receipt_filename?: string | null;
    }
  ): Promise<void> {
    const metaMap = getLocalData<Record<string, any>>(STORAGE_KEYS.TRANSACTIONS_META(churchId), {});
    metaMap[id] = {
      ...(metaMap[id] || {}),
      type: updates.type !== undefined ? updates.type : metaMap[id]?.type,
      status: updates.status !== undefined ? updates.status : metaMap[id]?.status,
      cost_center: updates.cost_center !== undefined ? updates.cost_center : metaMap[id]?.cost_center,
      admin_area: updates.admin_area !== undefined ? updates.admin_area : metaMap[id]?.admin_area,
      account_id: updates.account_id !== undefined ? updates.account_id : metaMap[id]?.account_id,
      account_name: updates.account_name !== undefined ? updates.account_name : metaMap[id]?.account_name,
      payment_method: updates.payment_method !== undefined ? updates.payment_method : metaMap[id]?.payment_method,
      receipt_url: updates.receipt_url !== undefined ? updates.receipt_url : metaMap[id]?.receipt_url,
      receipt_filename: updates.receipt_filename !== undefined ? updates.receipt_filename : metaMap[id]?.receipt_filename,
    };

    if (id.startsWith('local-plan-')) {
      metaMap[id] = {
        ...metaMap[id],
        amount: updates.amount !== undefined ? updates.amount : metaMap[id]?.amount,
        date: updates.date !== undefined ? updates.date : metaMap[id]?.date,
        category: updates.category !== undefined ? updates.category : metaMap[id]?.category,
        description: updates.description !== undefined ? updates.description : metaMap[id]?.description,
      };
      setLocalData(STORAGE_KEYS.TRANSACTIONS_META(churchId), metaMap);
    } else {
      await financialService.update(
        id,
        {
          type: updates.type === 'transferencia' ? 'saida' : (updates.type as any),
          category: updates.category,
          amount: updates.amount,
          description: updates.description,
          date: updates.date,
          receipt_url: updates.receipt_url,
          receipt_filename: updates.receipt_filename,
        },
        churchId
      );
      setLocalData(STORAGE_KEYS.TRANSACTIONS_META(churchId), metaMap);
    }
  },

  async toggleReconciled(churchId: string, id: string, reconciled: boolean): Promise<void> {
    const metaMap = getLocalData<Record<string, any>>(STORAGE_KEYS.TRANSACTIONS_META(churchId), {});
    if (!metaMap[id]) metaMap[id] = {};
    metaMap[id].is_reconciled = reconciled;
    setLocalData(STORAGE_KEYS.TRANSACTIONS_META(churchId), metaMap);
  },

  // 4. CÁLCULO DE SALDOS REAIS POR CONTA
  calculateAccountBalances(
    accounts: BankAccount[],
    transactions: FinancialTransactionExtended[],
    includePlanned: boolean = false
  ): {
    accountBalances: Record<string, { current: number; income: number; expense: number }>;
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
  } {
    const balances: Record<string, { current: number; income: number; expense: number }> = {};

    accounts.forEach(acc => {
      balances[acc.id] = {
        current: Number(acc.initial_balance) || 0,
        income: 0,
        expense: 0,
      };
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (!includePlanned && t.status === 'planejado') return;

      const accId = t.account_id || accounts[0]?.id;
      if (!balances[accId]) {
        balances[accId] = { current: 0, income: 0, expense: 0 };
      }

      if (t.type === 'entrada') {
        balances[accId].current += t.amount;
        balances[accId].income += t.amount;
        totalIncome += t.amount;
      } else if (t.type === 'saida') {
        balances[accId].current -= t.amount;
        balances[accId].expense += t.amount;
        totalExpense += t.amount;
      }
    });

    const totalBalance = Object.values(balances).reduce((sum, b) => sum + b.current, 0);

    return {
      accountBalances: balances,
      totalBalance,
      totalIncome,
      totalExpense,
    };
  },

  // 5. SIMULAÇÕES DINÂMICAS DE FLUXO DE CAIXA
  getSimulations(churchId: string): Array<{ id: string; name: string; type: 'receita' | 'despesa'; amount: number; date: string }> {
    return getLocalData(STORAGE_KEYS.SIMULATIONS(churchId), []);
  },

  addSimulation(churchId: string, item: { name: string; type: 'receita' | 'despesa'; amount: number; date: string }): void {
    const list = this.getSimulations(churchId);
    list.push({
      id: `sim-${Date.now()}`,
      ...item
    });
    setLocalData(STORAGE_KEYS.SIMULATIONS(churchId), list);
  },

  removeSimulation(churchId: string, id: string): void {
    const list = this.getSimulations(churchId).filter(s => s.id !== id);
    setLocalData(STORAGE_KEYS.SIMULATIONS(churchId), list);
  },

  clearSimulations(churchId: string): void {
    setLocalData(STORAGE_KEYS.SIMULATIONS(churchId), []);
  }
};
