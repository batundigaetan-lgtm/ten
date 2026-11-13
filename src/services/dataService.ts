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
    userId: string;
    walletId?: string;
    amount: number;
    destinationPhone: string;
    paymentMethod?: string;
  }): Promise<{ success: boolean; data?: WithdrawalRequestRow; error?: string }> {
    // 1. Règle 3 : Retrait minimum de 5 000 FC
    if (params.amount < 5000) {
      return { success: false, error: 'Le montant minimum de retrait est de 5 000 FC.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Connexion Supabase non configurée.' };
    }

    try {
      // 2. Règle 5 : Tentative d'exécution de la fonction PostgreSQL transactionnelle sécurisée (submit_withdrawal_request)
      try {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('submit_withdrawal_request', {
          p_user_id: params.userId,
          p_amount: params.amount,
          p_destination_phone: params.destinationPhone,
          p_payment_method: params.paymentMethod || 'airtel_money',
        });

        if (!rpcError && rpcData) {
          const resObj = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
          if (!resObj.success) {
            return { success: false, error: resObj.error || 'Erreur lors de la soumission du retrait.' };
          }
          return {
            success: true,
            data: {
              id: resObj.request_id || `REQ-${Date.now()}`,
              user_id: params.userId,
              wallet_id: params.walletId || null,
              amount: params.amount,
              fee: 0,
              net_amount: params.amount,
              destination_phone: params.destinationPhone,
              payment_method: params.paymentMethod || 'airtel_money',
              status: 'pending',
              rejection_reason: null,
              admin_id: null,
              processed_at: null,
              created_at: new Date().toISOString(),
            },
          };
        }
      } catch (rpcEx) {
        console.warn('[Supabase] RPC submit_withdrawal_request indisponible, bascule sur contrôle direct :', rpcEx);
      }

      // 3. Fallback direct avec vérifications strictes :
      const profile = await this.getProfile(params.userId);
      if (!profile?.is_activated) {
        return {
          success: false,
          error: "Droit de retrait bloqué : Votre compte est en attente d'activation. Effectuez votre premier dépôt pour activer votre compte et débloquer les retraits.",
        };
      }

      const wallet = await this.getWallet(params.userId);
      if (!wallet) {
        return { success: false, error: 'Portefeuille introuvable.' };
      }

      if (wallet.is_locked) {
        return { success: false, error: 'Ce portefeuille est temporairement verrouillé pour contrôle de sécurité.' };
      }

      // 4. Règle 3 : Le bonus de bienvenue (2 000 FC) ne peut être retiré directement
      const actualBalance = Number(wallet.available_balance_cdf ?? wallet.balance ?? 0);
      const withdrawableBalance = Math.max(0, actualBalance - 2000);

      // 5. Protection anti-doubles retraits / requêtes simultanées
      const { data: pendingRequests, error: pendingErr } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', params.userId)
        .eq('status', 'pending');

      const pendingSum = (!pendingErr && pendingRequests)
        ? pendingRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0)
        : 0;

      if (params.amount > (withdrawableBalance - pendingSum)) {
        return {
          success: false,
          error: `Solde retirable insuffisant (${Math.max(0, withdrawableBalance - pendingSum).toLocaleString('fr-FR')} FC disponibles). Le bonus de bienvenue de 2 000 FC est réservé et les demandes en attente sont déduites.`,
        };
      }

      // 6. Enregistrement en statut 'pending' obligatoire (aucune validation automatique)
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: params.userId,
          wallet_id: wallet.id,
          amount: params.amount,
          fee: 0,
          net_amount: params.amount,
          destination_phone: params.destinationPhone,
          payment_method: params.paymentMethod || 'airtel_money',
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as WithdrawalRequestRow };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de la soumission du retrait.' };
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
