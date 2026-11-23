import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Wallet = Database['public']['Tables']['wallets']['Row'];

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: 'user' | 'admin';
    referralCode: string;
    balance: number;
    totalInvested: number;
    totalEarned: number;
    isActivated: boolean;
    welcomeBonusClaimed: boolean;
  };
  error?: string;
}

/**
 * Service d'authentification Supabase respectant strictement les règles RLS
 * Aucune modification de solde n'est tentée depuis le client.
 * La création du profil et du portefeuille initial (0.00 FC) est assurée
 * par le déclencheur PostgreSQL SECURITY DEFINER 'on_auth_user_created'.
 */
export const authService = {
  isOnlineBackend(): boolean {
    return isSupabaseConfigured();
  },

  /**
   * Inscription sécurisée d'un utilisateur
   */
  async signUp(params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    referralCode?: string;
    referredBy?: string;
  }): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Supabase n'est pas encore configuré avec vos clés d'API." };
    }

    try {
      const generatedRef = params.referralCode || `RT${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // 1. Inscription dans Supabase Auth en passant les métadonnées pour le déclencheur SECURITY DEFINER
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.fullName,
            phone: params.phone,
            referral_code: generatedRef,
            referred_by: params.referredBy || null,
          },
        },
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || "Échec de l'inscription." };
      }

      const userId = authData.user.id;

      // Si la session est immédiatement disponible (email confirmation off), mise à jour douce du profil
      if (authData.session) {
        try {
          await supabase
            .from('profiles')
            .update({
              full_name: params.fullName,
              phone: params.phone,
            })
            .eq('id', userId);
        } catch {
          // Ignoré si géré par le trigger PostgreSQL
        }
      }

      return {
        success: true,
        user: {
          id: userId,
          email: params.email,
          fullName: params.fullName,
          phone: params.phone,
          role: 'user',
          referralCode: generatedRef,
          balance: 2000, // Bonus de bienvenue crédité dès la création
          totalInvested: 0,
          totalEarned: 0,
          isActivated: false, // Compte en attente d'activation par le premier dépôt
          welcomeBonusClaimed: true,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur inattendue lors de la création du compte.' };
    }
  },

  /**
   * Connexion avec email/mot de passe et chargement du profil + portefeuille
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Supabase non configuré." };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Identifiants invalides.' };
      }

      const userId = data.user.id;

      // Lecture du profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const profile = profileData as Profile | null;

      // Lecture du portefeuille réel depuis la table 'wallets'
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const wallet = walletData as Wallet | null;

      return {
        success: true,
        user: {
          id: userId,
          email: data.user.email || email,
          fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Investisseur',
          phone: profile?.phone || data.user.user_metadata?.phone || '',
          role: profile?.role || 'user',
          referralCode: profile?.referral_code || 'RT892X4',
          balance: Number(wallet?.available_balance_cdf ?? wallet?.balance ?? (profile?.welcome_bonus_claimed ? 2000 : 0)),
          totalInvested: Number(wallet?.total_deposited || 0),
          totalEarned: Number(wallet?.total_earned || 0),
          isActivated: Boolean(profile?.is_activated),
          welcomeBonusClaimed: Boolean(profile?.welcome_bonus_claimed),
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de la connexion.' };
    }
  },

  /**
   * Déconnexion
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Récupère la session courante
   */
  async getCurrentSession() {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /**
   * Récupère le profil complet d'un utilisateur par son ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Supabase] Erreur lecture profil :', error);
      return null;
    }
    return (data as Profile) || null;
  },
};
