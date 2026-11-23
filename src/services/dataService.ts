import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../types/supabase';

export type WalletRow = Database['public']['Tables']['wallets']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type InvestmentRow = Database['public']['Tables']['investments']['Row'];
export type DailyEarningRow = Database['public']['Tables']['daily_earnings']['Row'];
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type WithdrawalRequestRow = Database['public']['Tables']['withdrawal_requests']['Row'];
export type EquipmentRow = Database['public']['Tables']['equipment']['Row'];
export type InvestmentPlanRow = Database['public']['Tables']['investment_plans']['Row'];

/**
 * Service de gestion des données Supabase
 * Règle d'or : Aucun solde n'est modifiable directement côté client.
 * Tous les soldes proviennent de la table 'wallets'.
 * Les investissements proviennent de 'investments'.
 * Les revenus journaliers proviennent de 'daily_earnings'.
 */
export const dataService = {
  // ==========================================
  // 1. PROFIL & PORTEFEUILLE (Tables 'profiles' & 'wallets')
  // ==========================================
  async getProfile(userId: string): Promise<ProfileRow | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Erreur lecture profil :', error.message);
        return null;
      }

      return (data as ProfileRow) || null;
    } catch (err) {
      console.error('[Supabase] Exception getProfile :', err);
      return null;
    }
  },

  async getWallet(userId: string): Promise<WalletRow | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Erreur lecture portefeuille (wallets) :', error.message);
        return null;
      }

      if (data) {
        const row = data as WalletRow;
        const normalizedBal = Number(row.available_balance_cdf ?? row.balance ?? 0);
        return {
          ...row,
          balance: normalizedBal,
          available_balance_cdf: normalizedBal,
        };
      }

      return null;
    } catch (err) {
      console.error('[Supabase] Exception getWallet :', err);
      return null;
    }
  },

  // ==========================================
  // 2. INVESTISSEMENTS (Table 'investments')
  // ==========================================
  async getUserInvestments(userId: string): Promise<InvestmentRow[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Erreur lecture investissements :', error.message);
        return [];
      }

      return (data as InvestmentRow[]) || [];
    } catch (err) {
      console.error('[Supabase] Exception getUserInvestments :', err);
      return [];
    }
  },

  // ==========================================
  // 3. REVENUS JOURNALIERS (Table 'daily_earnings')
  // ==========================================
  async getDailyEarnings(userId: string): Promise<DailyEarningRow[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('daily_earnings')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('[Supabase] Erreur lecture revenus journaliers (daily_earnings) :', error.message);
        return [];
      }

      return (data as DailyEarningRow[]) || [];
    } catch (err) {
      console.error('[Supabase] Exception getDailyEarnings :', err);
      return [];
    }
  },

  // ==========================================
  // 4. TRANSACTIONS & HISTORIQUE (Table 'transactions')
  // ==========================================
  async getTransactions(userId: string): Promise<TransactionRow[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Erreur lecture transactions :', error.message);
        return [];
      }

      return (data as TransactionRow[]) || [];
    } catch (err) {
      console.error('[Supabase] Exception getTransactions :', err);
      return [];
    }
  },

  // ==========================================
  // 5. DEMANDES DE RETRAIT (Table 'withdrawal_requests')
  // Règles de sécurité :
  // - Compte impérativement activé par un premier dépôt MaishaPay confirmé (profiles.is_activated)
  // - Retrait minimum de 5 000 FC
  // - Bonus de bienvenue 2 000 FC non retirable directement
  // - Protection transactionnelle anti-concurrence (FOR UPDATE / RPC)
  // ==========================================
  async requestWithdrawal(params: {
    requestId: string;
    amount: number;
    destinationPhone: string;
    paymentMethod?: string;
  }): Promise<{
    success: boolean;
    data?: {
      requestId: string;
      status: 'pending' | 'processed' | 'rejected';
      availableBalance: number;
      lockedBalance: number;
      providerTransactionId?: string;
    };
    error?: string;
  }> {
    // 1. Règle 3 : Retrait minimum de 5 000 FC
    if (params.amount < 5000) {
      return { success: false, error: 'Le montant minimum de retrait est de 5 000 FC.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Connexion Supabase non configurée.' };
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        return { success: false, error: sessionError?.message || 'Session Supabase introuvable.' };
      }

      const response = await fetch('/api/maishapay/initiate-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          requestId: params.requestId,
          amount: params.amount,
          phone: params.destinationPhone,
          paymentMethod: params.paymentMethod || 'airtel_money',
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        return { success: false, error: result.error || 'Échec de la demande de retrait MaishaPay.' };
      }
      if (!result.requestId || !['pending', 'processed', 'rejected'].includes(result.status)) {
        return { success: false, error: 'Le serveur a retourné un état de retrait invalide.' };
      }
      const availableBalance = Number(result.availableBalance);
      const lockedBalance = Number(result.lockedBalance);
      if (!Number.isFinite(availableBalance) || !Number.isFinite(lockedBalance)) {
        return { success: false, error: 'Le serveur a retourné un solde de retrait invalide.' };
      }

      return {
        success: true,
        data: {
          requestId: result.requestId,
          status: result.status,
          availableBalance,
          lockedBalance,
          providerTransactionId: result.providerTransactionId,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de la soumission du retrait.' };
    }
  },

  async getWithdrawalStatus(requestId: string): Promise<{
    success: boolean;
    data?: {
      requestId: string;
      status: 'pending' | 'processed' | 'rejected';
      availableBalance: number;
      lockedBalance: number;
      providerTransactionId?: string;
    };
    error?: string;
  }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Connexion Supabase non configurée.' };
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        return { success: false, error: sessionError?.message || 'Session Supabase introuvable.' };
      }

      const response = await fetch(`/api/maishapay/withdrawal-status/${encodeURIComponent(requestId)}`, {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        return { success: false, error: result.error || 'Impossible de vérifier le retrait MaishaPay.' };
      }
      if (!result.requestId || !['pending', 'processed', 'rejected'].includes(result.status)) {
        return { success: false, error: 'Le serveur a retourné un état de retrait invalide.' };
      }
      const availableBalance = Number(result.availableBalance);
      const lockedBalance = Number(result.lockedBalance);
      if (!Number.isFinite(availableBalance) || !Number.isFinite(lockedBalance)) {
        return { success: false, error: 'Le serveur a retourné un solde de retrait invalide.' };
      }

      return {
        success: true,
        data: {
          requestId: result.requestId,
          status: result.status,
          availableBalance,
          lockedBalance,
          providerTransactionId: result.providerTransactionId,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur de vérification du retrait.' };
    }
  },

  // ==========================================
  // 6. MATÉRIEL & PLANS D'INVESTISSEMENT ('equipment', 'investment_plans')
  // ==========================================
  async getInvestmentPlans(): Promise<InvestmentPlanRow[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) return [];
      return (data as InvestmentPlanRow[]) || [];
    } catch {
      return [];
    }
  },

  async getEquipmentList(): Promise<EquipmentRow[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data as EquipmentRow[]) || [];
    } catch {
      return [];
    }
  },

  // ==========================================
  // 7. AUDIT & SÉCURITÉ ('admin_logs')
  // ==========================================
  async logAdminAction(params: {
    adminId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase.from('admin_logs').insert({
        admin_id: params.adminId || null,
        action: params.action,
        target_type: params.targetType || null,
        target_id: params.targetId || null,
        details: params.details || null,
      } as any);
    } catch (err) {
      console.warn('[Supabase] Note audit admin_logs :', err);
    }
  },
};
