export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // UUID references auth.users(id)
          full_name: string;
          email: string;
          phone: string;
          role: 'user' | 'admin';
          referral_code: string;
          referred_by: string | null;
          avatar_url: string | null;
          is_activated: boolean;
          welcome_bonus_claimed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string;
          role?: 'user' | 'admin';
          referral_code?: string;
          referred_by?: string | null;
          avatar_url?: string | null;
          is_activated?: boolean;
          welcome_bonus_claimed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          role?: 'user' | 'admin';
          referral_code?: string;
          referred_by?: string | null;
          avatar_url?: string | null;
          is_activated?: boolean;
          welcome_bonus_claimed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      equipment: {
        Row: {
          id: string;
          name: string;
          category: string;
          serial_number: string | null;
          specs: Json | null;
          purchase_price: number;
          daily_rental_rate: number;
          status: 'available' | 'rented' | 'maintenance';
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          serial_number?: string | null;
          specs?: Json | null;
          purchase_price: number;
          daily_rental_rate: number;
          status?: 'available' | 'rented' | 'maintenance';
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          serial_number?: string | null;
          specs?: Json | null;
          purchase_price?: number;
          daily_rental_rate?: number;
          status?: 'available' | 'rented' | 'maintenance';
          location?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      investment_plans: {
        Row: {
          id: string;
          name: string;
          category: string;
          level: number;
          min_amount: number;
          max_amount: number;
          daily_yield: number;
          duration_days: number;
          commission_rate: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          level: number;
          min_amount: number;
          max_amount: number;
          daily_yield: number;
          duration_days?: number;
          commission_rate?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          level?: number;
          min_amount?: number;
          max_amount?: number;
          daily_yield?: number;
          duration_days?: number;
          commission_rate?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      investments: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          equipment_id: string | null;
          pack_name: string;
          amount: number;
          daily_yield: number;
          status: 'active' | 'completed' | 'cancelled';
          start_date: string;
          end_date: string | null;
          last_payout_at: string | null;
          total_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          equipment_id?: string | null;
          pack_name: string;
          amount: number;
          daily_yield: number;
          status?: 'active' | 'completed' | 'cancelled';
          start_date?: string;
          end_date?: string | null;
          last_payout_at?: string | null;
          total_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          equipment_id?: string | null;
          pack_name?: string;
          amount?: number;
          daily_yield?: number;
          status?: 'active' | 'completed' | 'cancelled';
          start_date?: string;
          end_date?: string | null;
          last_payout_at?: string | null;
          total_earned?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          available_balance_cdf: number;
          currency: string;
          total_deposited: number;
          total_withdrawn: number;
          total_earned: number;
          is_locked: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          available_balance_cdf?: number;
          currency?: string;
          total_deposited?: number;
          total_withdrawn?: number;
          total_earned?: number;
          is_locked?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          available_balance_cdf?: number;
          currency?: string;
          total_deposited?: number;
          total_withdrawn?: number;
          total_earned?: number;
          is_locked?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      transactions: {
        Row: {
          id: string;
          wallet_id: string | null;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'investment' | 'daily_yield' | 'referral_bonus';
          amount: number;
          fee: number;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          reference_id: string | null;
          description: string | null;
          payment_method: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id?: string | null;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'investment' | 'daily_yield' | 'referral_bonus';
          amount: number;
          fee?: number;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          reference_id?: string | null;
          description?: string | null;
          payment_method?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_id?: string | null;
          user_id?: string;
          type?: 'deposit' | 'withdrawal' | 'investment' | 'daily_yield' | 'referral_bonus';
          amount?: number;
          fee?: number;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          reference_id?: string | null;
          description?: string | null;
          payment_method?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };

      ledger_entries: {
        Row: {
          id: string;
          transaction_id: string | null;
          wallet_id: string;
          user_id: string;
          entry_type: 'debit' | 'credit';
          amount: number;
          balance_after: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id?: string | null;
          wallet_id: string;
          user_id: string;
          entry_type: 'debit' | 'credit';
          amount: number;
          balance_after: number;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string | null;
          wallet_id?: string;
          user_id?: string;
          entry_type?: 'debit' | 'credit';
          amount?: number;
          balance_after?: number;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      daily_earnings: {
        Row: {
          id: string;
          investment_id: string;
          user_id: string;
          rental_revenue_id: string | null;
          amount: number;
          date: string;
          status: 'credited' | 'pending' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          investment_id: string;
          user_id: string;
          rental_revenue_id?: string | null;
          amount: number;
          date: string;
          status?: 'credited' | 'pending' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          investment_id?: string;
          user_id?: string;
          rental_revenue_id?: string | null;
          amount?: number;
          date?: string;
          status?: 'credited' | 'pending' | 'failed';
          created_at?: string;
        };
        Relationships: [];
      };

      withdrawal_requests: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string | null;
          amount: number;
          fee: number;
          net_amount: number;
          payment_method: string;
          destination_phone: string;
          status: 'pending' | 'approved' | 'rejected' | 'processed';
          rejection_reason: string | null;
          admin_id: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id?: string | null;
          amount: number;
          fee?: number;
          net_amount?: number;
          payment_method?: string;
          destination_phone: string;
          status?: 'pending' | 'approved' | 'rejected' | 'processed';
          rejection_reason?: string | null;
          admin_id?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string | null;
          amount?: number;
          fee?: number;
          net_amount?: number;
          payment_method?: string;
          destination_phone?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'processed';
          rejection_reason?: string | null;
          admin_id?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      payment_webhooks: {
        Row: {
          id: string;
          provider: 'maishapay' | 'airtel';
          payload: Json;
          signature: string | null;
          status: 'received' | 'processed' | 'failed';
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider: 'maishapay' | 'airtel';
          payload: Json;
          signature?: string | null;
          status?: 'received' | 'processed' | 'failed';
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider?: 'maishapay' | 'airtel';
          payload?: Json;
          signature?: string | null;
          status?: 'received' | 'processed' | 'failed';
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      rental_revenue: {
        Row: {
          id: string;
          equipment_id: string;
          client_name: string;
          rental_period_start: string;
          rental_period_end: string;
          revenue_amount: number;
          expenses: number;
          net_revenue: number;
          distributed_amount: number;
          status: 'collected' | 'distributed';
          created_at: string;
        };
        Insert: {
          id?: string;
          equipment_id: string;
          client_name: string;
          rental_period_start: string;
          rental_period_end: string;
          revenue_amount: number;
          expenses?: number;
          net_revenue?: number;
          distributed_amount?: number;
          status?: 'collected' | 'distributed';
          created_at?: string;
        };
        Update: {
          id?: string;
          equipment_id?: string;
          client_name?: string;
          rental_period_start?: string;
          rental_period_end?: string;
          revenue_amount?: number;
          expenses?: number;
          net_revenue?: number;
          distributed_amount?: number;
          status?: 'collected' | 'distributed';
          created_at?: string;
        };
        Relationships: [];
      };

      admin_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
