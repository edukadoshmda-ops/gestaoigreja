import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];
type FinancialTransactionInsert = Database['public']['Tables']['financial_transactions']['Insert'];
type FinancialTransactionUpdate = Database['public']['Tables']['financial_transactions']['Update'];

export const financialService = {
    /**
     * Get all transactions
     */
    async getAll() {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get transactions by date range
     */
    async getByDateRange(startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get transactions by type
     */
    async getByType(type: 'entrada' | 'saida') {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('type', type)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get transactions by category
     */
    async getByCategory(category: string) {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('category', category)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get a single transaction by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new transaction
     */
    async create(transaction: FinancialTransactionInsert) {
        const { data, error } = await supabase
            .from('financial_transactions')
            .insert(transaction)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a transaction
     */
    async update(id: string, updates: FinancialTransactionUpdate) {
        const { data, error } = await supabase
            .from('financial_transactions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a transaction
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get financial summary
     */
    async getSummary() {
        const { data, error } = await supabase
            .from('financial_summary')
            .select('*')
            .order('month', { ascending: false })
            .limit(12);

        if (error) throw error;
        return data;
    },

    /**
     * Get total income
     */
    async getTotalIncome(startDate?: string, endDate?: string) {
        let query = supabase
            .from('financial_transactions')
            .select('amount')
            .eq('type', 'entrada');

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;

        if (error) throw error;

        return data.reduce((sum, t) => sum + Number(t.amount), 0);
    },

    /**
     * Get total expenses
     */
    async getTotalExpenses(startDate?: string, endDate?: string) {
        let query = supabase
            .from('financial_transactions')
            .select('amount')
            .eq('type', 'saida');

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;

        if (error) throw error;

        return data.reduce((sum, t) => sum + Number(t.amount), 0);
    },

    /**
     * Get balance
     */
    async getBalance(startDate?: string, endDate?: string) {
        const income = await this.getTotalIncome(startDate, endDate);
        const expenses = await this.getTotalExpenses(startDate, endDate);
        return income - expenses;
    },

    /**
     * Get categories
     */
    async getCategories() {
        const { data, error } = await supabase
            .from('financial_categories')
            .select('*')
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Upload receipt
     */
    async uploadReceipt(transactionId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${transactionId}-${Date.now()}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        // Update transaction with receipt URL
        await this.update(transactionId, { receipt_url: publicUrl });

        return publicUrl;
    },
};
