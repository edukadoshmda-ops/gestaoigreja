import { supabase } from '@/lib/supabaseClient';

export interface Budget {
    id: string;
    category: string;
    amount: number;
    month: string;
    church_id: string;
}

export const budgetsService = {
    async listByMonth(month: string) {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('month', month);

        if (error) throw error;
        return data as Budget[];
    },

    async upsert(budget: Omit<Budget, 'id' | 'church_id'>, churchId: string) {
        const { data, error } = await (supabase.from('budgets') as any)
            .upsert({
                category: budget.category,
                amount: budget.amount,
                month: budget.month,
                church_id: churchId
            } as any, {
                onConflict: 'church_id, category, month'
            })
            .select()
            .single();

        if (error) throw error;
        return data as Budget;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
