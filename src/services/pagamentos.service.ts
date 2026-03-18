import { criarPagamentoStone, criarContaStone } from '@/lib/pagarme';
import type { Database } from '@/lib/database.types';

export type Payment = Database['public']['Tables']['payments']['Row'];

async function criarContaStoneParaIgreja(input: {
  churchId?: string;
  nome: string;
  cnpj: string;
}) {
  return criarContaStone({
    church_id: input.churchId,
    nome: input.nome,
    cnpj: input.cnpj,
  });
}

async function criarPix(input: {
  churchId?: string;
  cnpj?: string;
  memberId?: string;
  valor: number;
  descricao?: string;
  tipo?: string; // default "doacao"
}): Promise<{ checkout_url?: string | null; qr_code_url?: string | null; payment?: Payment }> {
  const data: any = await criarPagamentoStone({
    church_id: input.churchId,
    cnpj: input.cnpj,
    member_id: input.memberId,
    amount: input.valor,
    type: input.tipo ?? 'doacao',
    description: input.descricao,
  });

  return {
    checkout_url: data?.checkout_url ?? null,
    qr_code_url: data?.qr_code_url ?? null,
    payment: data?.payment ?? undefined,
  };
}

export const pagamentosService = {
  criarContaStoneParaIgreja,
  criarPix,
};

