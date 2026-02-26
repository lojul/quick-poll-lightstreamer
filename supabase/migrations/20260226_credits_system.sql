-- Credit-Based Payment System Migration
-- Adds profiles, credit transactions, and stripe payments tables

-- ============================================
-- 1. CREATE PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 100,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (fallback if trigger fails)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile (but not credits directly - use functions)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 2. CREATE CREDIT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for additions, negative for deductions
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('signup_bonus', 'poll_creation', 'vote', 'purchase', 'refund', 'admin_adjustment')),
  reference_id UUID, -- poll_id, payment_id, etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert transactions
CREATE POLICY "Service role full access" ON public.credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- ============================================
-- 3. CREATE STRIPE PAYMENTS TABLE
-- ============================================
CREATE TABLE public.stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  credits_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  package_type TEXT NOT NULL CHECK (package_type IN ('small', 'medium', 'large')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.stripe_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.stripe_payments
  FOR ALL USING (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX idx_stripe_payments_user_id ON public.stripe_payments(user_id);
CREATE INDEX idx_stripe_payments_session_id ON public.stripe_payments(stripe_session_id);

-- ============================================
-- 4. ADD COLUMNS TO EXISTING TABLES
-- ============================================
-- Add created_by to polls
ALTER TABLE public.polls ADD COLUMN created_by UUID REFERENCES public.profiles(id);

-- Add voter_id to votes
ALTER TABLE public.votes ADD COLUMN voter_id UUID REFERENCES public.profiles(id);

-- ============================================
-- 5. CREATE DATABASE FUNCTIONS
-- ============================================

-- Function to deduct credits for poll creation
CREATE OR REPLACE FUNCTION public.deduct_credits_for_poll(
  p_user_id UUID,
  p_poll_id UUID,
  p_cost INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_current_credits < p_cost THEN
    RETURN FALSE;
  END IF;

  v_new_credits := v_current_credits - p_cost;

  -- Update credits
  UPDATE profiles
  SET credits = v_new_credits, updated_at = now()
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, reference_id, description)
  VALUES (p_user_id, -p_cost, v_new_credits, 'poll_creation', p_poll_id, 'Poll creation cost');

  RETURN TRUE;
END;
$$;

-- Function to deduct credits for voting
CREATE OR REPLACE FUNCTION public.deduct_credits_for_vote(
  p_user_id UUID,
  p_poll_id UUID,
  p_cost INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_current_credits < p_cost THEN
    RETURN FALSE;
  END IF;

  v_new_credits := v_current_credits - p_cost;

  -- Update credits
  UPDATE profiles
  SET credits = v_new_credits, updated_at = now()
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, reference_id, description)
  VALUES (p_user_id, -p_cost, v_new_credits, 'vote', p_poll_id, 'Vote cost');

  RETURN TRUE;
END;
$$;

-- Function to add credits from purchase
CREATE OR REPLACE FUNCTION public.add_credits_from_purchase(
  p_user_id UUID,
  p_credits INTEGER,
  p_payment_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  v_new_credits := v_current_credits + p_credits;

  -- Update credits
  UPDATE profiles
  SET credits = v_new_credits, updated_at = now()
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, balance_after, transaction_type, reference_id, description)
  VALUES (p_user_id, p_credits, v_new_credits, 'purchase', p_payment_id, 'Credit purchase');

  RETURN TRUE;
END;
$$;

-- ============================================
-- 6. CREATE TRIGGER FOR AUTO-CREATING PROFILE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with 100 free credits
  INSERT INTO public.profiles (id, credits)
  VALUES (NEW.id, 100);

  -- Log the signup bonus
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, description)
  VALUES (NEW.id, 100, 100, 'signup_bonus', 'Welcome bonus credits');

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 9. BACKFILL EXISTING USERS
-- ============================================
-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (id, credits)
SELECT id, 100
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Log signup bonus for backfilled users
INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, description)
SELECT p.id, 100, 100, 'signup_bonus', 'Welcome bonus credits (backfill)'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions ct
  WHERE ct.user_id = p.id AND ct.transaction_type = 'signup_bonus'
);

-- ============================================
-- 7. UPDATE TIMESTAMPS TRIGGER FOR PROFILES
-- ============================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_credits_for_poll TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits_for_vote TO authenticated;
-- add_credits_from_purchase should only be called by service role (Edge Functions)
