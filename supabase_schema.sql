-- =========================================================================
-- SCRIPT DE SÉCURITÉ POSTGRESQL SUPABASE - RENTTECH HUB
-- Architecture Zero-Trust : Aucune permission directe de modification de solde pour le client
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE PROFILES (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 3. TABLE WALLETS (Portefeuille financier - Règle de sécurité absolue : Jamais modifiable par le client)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
  available_balance_cdf NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance_cdf >= 0.00),
  locked_balance_cdf NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (locked_balance_cdf >= 0.00),
  currency TEXT NOT NULL DEFAULT 'CDF',
  total_deposited NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_deposited >= 0.00),
  total_withdrawn NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0.00),
  total_earned NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0.00),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS available_balance_cdf NUMERIC(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS locked_balance_cdf NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (locked_balance_cdf >= 0.00);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- 4. TABLE TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'daily_yield', 'referral_bonus')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
  fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id TEXT,
  description TEXT,
  payment_method TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.transactions
    WHERE reference_id IS NOT NULL
    GROUP BY reference_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate transactions.reference_id values must be resolved before applying payment idempotency.';
  END IF;
END;
$$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_reference_id_unique
  ON public.transactions(reference_id)
  WHERE reference_id IS NOT NULL;

-- 4a. GRAND LIVRE FINANCIER
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
  balance_after NUMERIC(15, 2) NOT NULL CHECK (balance_after >= 0.00),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_created
  ON public.ledger_entries(user_id, created_at DESC);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.ledger_entries
    WHERE transaction_id IS NOT NULL
    GROUP BY transaction_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate ledger_entries.transaction_id values must be resolved before applying payment idempotency.';
  END IF;
END;
$$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_entries_transaction_unique
  ON public.ledger_entries(transaction_id)
  WHERE transaction_id IS NOT NULL;

-- 5. TABLE WITHDRAWAL REQUESTS (Réservations et transferts MaishaPay)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 5000.00),
  fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  net_amount NUMERIC(15, 2) NOT NULL CHECK (net_amount > 0.00),
  payment_method TEXT NOT NULL DEFAULT 'airtel_money',
  destination_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  rejection_reason TEXT,
  provider_transaction_id TEXT,
  admin_id UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT;

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);

-- 6. TABLE INVESTMENTS (Packs de location de matériel)
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID,
  equipment_id UUID,
  pack_name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
  daily_yield NUMERIC(15, 2) NOT NULL CHECK (daily_yield >= 0.00),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  end_date TIMESTAMPTZ,
  last_payout_at TIMESTAMPTZ,
  total_earned NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);

-- 7. TABLE DAILY EARNINGS (Alimentée exclusivement par les recettes réelles de location)
CREATE TABLE IF NOT EXISTS public.daily_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rental_revenue_id UUID,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0.00),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'credited' CHECK (status IN ('credited', 'pending', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_daily_earnings_user_date ON public.daily_earnings(user_id, date);

-- =========================================================================
-- POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_earnings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_activated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN NOT NULL DEFAULT false;

-- 1. Profiles : Lecture et mise à jour limitée (nom, téléphone) par le titulaire
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND is_activated = (SELECT p.is_activated FROM public.profiles p WHERE p.id = auth.uid())
    AND welcome_bonus_claimed = (SELECT p.welcome_bonus_claimed FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 2. Wallets : Lecture seule pour l'utilisateur. INTERDICTION STRICTE DE MODIFIER LE SOLDE
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Aucune politique INSERT, UPDATE ou DELETE pour les utilisateurs sur 'wallets'.
-- Seul le déclencheur SECURITY DEFINER ou le backend avec privilèges de service peut modifier 'wallets'.

-- 3. Transactions : Lecture seule de ses propres transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Withdrawal Requests : Création d'une demande et consultation de son statut
-- Règle 3 : Aucun retrait si le compte n'est pas activé, montant minimum 5 000 FC
DROP POLICY IF EXISTS "withdrawals_select_own" ON public.withdrawal_requests;
CREATE POLICY "withdrawals_select_own"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "withdrawals_insert_own" ON public.withdrawal_requests;

-- 5. Investments & Daily Earnings : Lecture seule par le titulaire
DROP POLICY IF EXISTS "investments_select_own" ON public.investments;
CREATE POLICY "investments_select_own"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_earnings_select_own" ON public.daily_earnings;
CREATE POLICY "daily_earnings_select_own"
  ON public.daily_earnings FOR SELECT
  USING (auth.uid() = user_id);

-- =========================================================================
-- DÉCLENCHEUR POSTGRESQL SÉCURISÉ (SECURITY DEFINER, SEARCH_PATH CONTRÔLÉ)
-- Règle 1 : Bonus de bienvenue automatique de 2 000 FC octroyé UNE SEULE FOIS
-- Règle 2 : Compte initialisé au statut 'En attente d'activation' (is_activated = false)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  gen_referral TEXT;
  v_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  gen_referral := COALESCE(
    NEW.raw_user_meta_data->>'referral_code',
    'RT' || UPPER(SUBSTRING(MD5(NEW.id::TEXT || RANDOM()::TEXT), 1, 6))
  );

  -- 1. Création du profil avec rôle 'user' obligatoire et statut 'En attente d'activation'
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    referral_code,
    referred_by,
    is_activated,
    welcome_bonus_claimed
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Investisseur'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user',
    gen_referral,
    NEW.raw_user_meta_data->>'referred_by',
    false, -- Statut initial : En attente d'activation
    true   -- Marqué comme ayant reçu son bonus
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    updated_at = timezone('utc'::text, now());

  -- Vérifier si le portefeuille existe déjà
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.id;

  IF v_wallet_id IS NULL THEN
    -- 2. Création du portefeuille avec BONUS DE BIENVENUE : 2 000 FC
    INSERT INTO public.wallets (
      user_id,
      balance,
      available_balance_cdf,
      locked_balance_cdf,
      currency,
      total_deposited,
      total_withdrawn,
      total_earned,
      is_locked
    )
    VALUES (
      NEW.id,
      2000.00, -- Bonus de bienvenue crédité de manière atomique
      2000.00, -- Crédité directement dans available_balance_cdf
      0.00,
      'CDF',
      0.00,    -- Ne provient PAS d'un dépôt
      0.00,
      0.00,    -- Ne provient PAS des recettes de location
      false
    )
    RETURNING id INTO v_wallet_id;

    -- 3. Enregistrement correspondant dans 'transactions'
    INSERT INTO public.transactions (
      wallet_id,
      user_id,
      type,
      amount,
      fee,
      status,
      description,
      payment_method
    )
    VALUES (
      v_wallet_id,
      NEW.id,
      'referral_bonus',
      2000.00,
      0.00,
      'completed',
      'Bonus de bienvenue RentTech Hub',
      'system_welcome_bonus'
    )
    RETURNING id INTO v_transaction_id;

    -- 4. Écriture unique dans le grand livre
    INSERT INTO public.ledger_entries (
      transaction_id,
      wallet_id,
      user_id,
      entry_type,
      amount,
      balance_after,
      description
    )
    VALUES (
      v_transaction_id,
      v_wallet_id,
      NEW.id,
      'credit',
      2000.00,
      2000.00,
      'Bonus de bienvenue RentTech Hub'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Révocation de tout privilège public d'exécution sur le trigger
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin;

-- Déclenchement automatique sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- FONCTION SÉCURISÉE D'ACTIVATION ET DE CRÉDIT DE DÉPÔT (MAISHAPAY CONFIRMÉ)
-- Règle 2 & 8 : Seul un dépôt réel confirmé par webhook active le compte une seule fois
-- =========================================================================

CREATE OR REPLACE FUNCTION public.confirm_deposit_and_activate(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reference TEXT,
  p_payment_method TEXT DEFAULT 'maishapay'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction_id UUID;
  v_wallet_id UUID;
  v_tx_user_id UUID;
  v_tx_amount NUMERIC;
  v_tx_status TEXT;
  v_balance NUMERIC;
  v_available NUMERIC;
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount <= 0.00 OR p_reference IS NULL OR btrim(p_reference) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Montant ou référence de dépôt invalide.');
  END IF;

  -- The provider reference is persisted before the payment is initiated.
  SELECT id, user_id, wallet_id, amount, status
  INTO v_transaction_id, v_tx_user_id, v_wallet_id, v_tx_amount, v_tx_status
  FROM public.transactions
  WHERE reference_id = p_reference AND type = 'deposit'
  FOR UPDATE;

  IF v_transaction_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction de dépôt introuvable.');
  END IF;
  IF v_tx_user_id <> p_user_id OR v_tx_amount <> p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Les données du dépôt ne correspondent pas à la transaction.');
  END IF;

  IF v_tx_status = 'completed' THEN
    SELECT balance INTO v_balance FROM public.wallets WHERE id = v_wallet_id;
    RETURN jsonb_build_object('success', true, 'new_balance', v_balance, 'is_activated', true);
  END IF;
  IF v_tx_status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cette transaction de dépôt ne peut plus être créditée.');
  END IF;

  -- Lock the wallet row so concurrent confirmations cannot lose a credit.
  SELECT balance, available_balance_cdf
  INTO v_balance, v_available
  FROM public.wallets
  WHERE id = v_wallet_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Portefeuille introuvable.');
  END IF;

  v_balance := v_balance + p_amount;
  v_available := v_available + p_amount;

  UPDATE public.wallets
  SET balance = v_balance,
      available_balance_cdf = v_available,
      total_deposited = total_deposited + p_amount,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_wallet_id;

  UPDATE public.profiles
  SET is_activated = true,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id AND is_activated = false;

  UPDATE public.transactions
  SET status = 'completed',
      description = 'Dépôt confirmé MaishaPay - Compte Activé',
      payment_method = p_payment_method
  WHERE id = v_transaction_id;

  INSERT INTO public.ledger_entries (
    transaction_id,
    wallet_id,
    user_id,
    entry_type,
    amount,
    balance_after,
    description
  )
  VALUES (
    v_transaction_id,
    v_wallet_id,
    p_user_id,
    'credit',
    p_amount,
    v_balance,
    'Dépôt validé MaishaPay - Activation du compte'
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_balance,
    'is_activated', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_deposit_and_activate(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_deposit_and_activate(UUID, NUMERIC, TEXT, TEXT) TO postgres, service_role;

-- =========================================================================
-- FONCTION TRANSACTIONNELLE DE RETRAIT AVEC PROTECTION ANTI-CONCURRENCE (FOR UPDATE)
-- Règle 3 & 5 : Deux demandes simultanées ne peuvent jamais dépasser le solde
-- Le bonus de 2 000 FC est strictement exclu du montant retirable
-- =========================================================================

DROP FUNCTION IF EXISTS public.submit_withdrawal_request(UUID, NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
  p_request_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_destination_phone TEXT,
  p_payment_method TEXT DEFAULT 'airtel_money'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_wallet_id UUID;
  v_avail_bal NUMERIC;
  v_locked_bal NUMERIC;
  v_is_locked BOOLEAN;
  v_is_activated BOOLEAN;
  v_withdrawable NUMERIC;
  v_new_req_id UUID;
  v_existing_user UUID;
  v_existing_amount NUMERIC;
  v_existing_phone TEXT;
  v_existing_status TEXT;
BEGIN
  IF p_request_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Référence de demande requise.');
  END IF;
  IF auth.uid() IS DISTINCT FROM p_user_id AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non autorisé.');
  END IF;
  IF p_amount IS NULL OR p_destination_phone IS NULL OR btrim(p_destination_phone) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Montant ou numéro de destination invalide.');
  END IF;

  SELECT user_id, amount, destination_phone, status
  INTO v_existing_user, v_existing_amount, v_existing_phone, v_existing_status
  FROM public.withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing_user <> p_user_id OR v_existing_amount <> p_amount OR v_existing_phone <> p_destination_phone THEN
      RETURN jsonb_build_object('success', false, 'error', 'La référence de retrait existe déjà avec des données différentes.');
    END IF;

    SELECT available_balance_cdf, locked_balance_cdf
    INTO v_avail_bal, v_locked_bal
    FROM public.wallets
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'request_id', p_request_id,
      'amount', p_amount,
      'available_balance_cdf', v_avail_bal,
      'locked_balance_cdf', v_locked_bal,
      'status', v_existing_status,
      'already_exists', true
    );
  END IF;

  -- 1. Vérification du statut d'activation du compte
  SELECT is_activated INTO v_is_activated
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_is_activated IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil utilisateur introuvable.');
  END IF;

  IF NOT v_is_activated THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Droit de retrait bloqué : Votre compte est en attente d''activation. Effectuez votre premier dépôt pour activer votre compte et débloquer les retraits.'
    );
  END IF;

  -- 2. Montant minimum de 5 000 FC
  IF p_amount < 5000.00 OR p_amount <> trunc(p_amount) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le montant minimum de retrait est de 5 000 FC.');
  END IF;

  -- Locking the wallet row serializes reservations and prevents double spending.
  SELECT id, available_balance_cdf, locked_balance_cdf, is_locked
  INTO v_wallet_id, v_avail_bal, v_locked_bal, v_is_locked
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Portefeuille introuvable.');
  END IF;

  IF v_is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce portefeuille est temporairement verrouillé pour contrôle de sécurité.');
  END IF;

  -- The welcome bonus remains in the available balance but is not withdrawable.
  v_withdrawable := GREATEST(0.00, v_avail_bal - 2000.00);

  IF p_amount > v_withdrawable THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Solde retirable insuffisant (%s FC disponibles). Le bonus de bienvenue de 2 000 FC est réservé à l''investissement locatif.', v_withdrawable)
    );
  END IF;

  UPDATE public.wallets
  SET available_balance_cdf = available_balance_cdf - p_amount,
      locked_balance_cdf = locked_balance_cdf + p_amount,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_wallet_id
  RETURNING available_balance_cdf, locked_balance_cdf
  INTO v_avail_bal, v_locked_bal;

  INSERT INTO public.withdrawal_requests (
    id,
    user_id,
    wallet_id,
    amount,
    fee,
    net_amount,
    destination_phone,
    payment_method,
    status
  )
  VALUES (
    p_request_id,
    p_user_id,
    v_wallet_id,
    p_amount,
    0.00,
    p_amount,
    p_destination_phone,
    p_payment_method,
    'pending'
  )
  RETURNING id INTO v_new_req_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_new_req_id,
    'amount', p_amount,
    'available_balance_cdf', v_avail_bal,
    'locked_balance_cdf', v_locked_bal,
    'status', 'pending',
    'already_exists', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_withdrawal_request(UUID, UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_withdrawal_request(UUID, UUID, NUMERIC, TEXT, TEXT) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.finalize_withdrawal_request(UUID, BOOLEAN, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.finalize_withdrawal_request(
  p_request_id UUID,
  p_success BOOLEAN,
  p_reference TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL,
  p_provider_transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_id UUID;
  v_amount NUMERIC;
  v_payment_method TEXT;
  v_status TEXT;
  v_balance NUMERIC;
  v_locked_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Opération réservée au serveur de paiement.');
  END IF;
  IF p_success IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Résultat du paiement manquant.');
  END IF;

  SELECT user_id, wallet_id, amount, payment_method, status
  INTO v_user_id, v_wallet_id, v_amount, v_payment_method, v_status
  FROM public.withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Demande de retrait introuvable.');
  END IF;
  IF v_status = 'processed' THEN
    RETURN jsonb_build_object('success', true, 'status', 'processed');
  END IF;
  IF v_status = 'rejected' THEN
    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  END IF;
  IF v_status <> 'pending' OR v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cette demande ne peut pas être finalisée.');
  END IF;

  SELECT balance, locked_balance_cdf
  INTO v_balance, v_locked_balance
  FROM public.wallets
  WHERE id = v_wallet_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_locked_balance < v_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le montant réservé du portefeuille ne correspond pas à la demande.');
  END IF;

  IF p_success THEN
    IF p_reference IS NULL OR btrim(p_reference) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'La référence MaishaPay est obligatoire pour un paiement confirmé.');
    END IF;

    UPDATE public.wallets
    SET balance = balance - v_amount,
        locked_balance_cdf = locked_balance_cdf - v_amount,
        total_withdrawn = total_withdrawn + v_amount,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet_id
    RETURNING balance INTO v_balance;

    UPDATE public.withdrawal_requests
    SET status = 'processed',
        provider_transaction_id = COALESCE(p_provider_transaction_id, provider_transaction_id),
        processed_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    INSERT INTO public.transactions (
      wallet_id, user_id, type, amount, fee, status, reference_id,
      description, payment_method, metadata
    )
    VALUES (
      v_wallet_id, v_user_id, 'withdrawal', v_amount, 0.00, 'completed', p_reference,
      'Retrait confirmé par MaishaPay', v_payment_method,
      jsonb_build_object(
        'withdrawal_request_id', p_request_id,
        'provider_transaction_id', p_provider_transaction_id
      )
    )
    RETURNING id INTO v_transaction_id;

    INSERT INTO public.ledger_entries (
      transaction_id, wallet_id, user_id, entry_type, amount, balance_after, description
    )
    VALUES (
      v_transaction_id, v_wallet_id, v_user_id, 'debit', v_amount, v_balance,
      'Retrait confirmé par MaishaPay'
    );
  ELSE
    UPDATE public.wallets
    SET available_balance_cdf = available_balance_cdf + v_amount,
        locked_balance_cdf = locked_balance_cdf - v_amount,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet_id;

    UPDATE public.withdrawal_requests
    SET status = 'rejected',
        rejection_reason = COALESCE(NULLIF(p_error, ''), 'Paiement refusé par MaishaPay'),
        provider_transaction_id = COALESCE(p_provider_transaction_id, provider_transaction_id),
        processed_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    INSERT INTO public.transactions (
      wallet_id, user_id, type, amount, fee, status, reference_id,
      description, payment_method, metadata
    )
    VALUES (
      v_wallet_id, v_user_id, 'withdrawal', v_amount, 0.00, 'failed',
      COALESCE(NULLIF(p_reference, ''), 'withdrawal-failed-' || p_request_id::TEXT),
      COALESCE(NULLIF(p_error, ''), 'Retrait refusé par MaishaPay'),
      v_payment_method,
      jsonb_build_object(
        'withdrawal_request_id', p_request_id,
        'provider_transaction_id', p_provider_transaction_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN p_success THEN 'processed' ELSE 'rejected' END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_withdrawal_request(UUID, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_withdrawal_request(UUID, BOOLEAN, TEXT, TEXT, TEXT) TO service_role;


