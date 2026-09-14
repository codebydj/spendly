-- Spendly Complete Supabase Database Schema & Row Level Security Policies
-- Run this script in the Supabase SQL Editor for project https://seerpislmkozvislqwaz.supabase.co

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  opening_balance NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  institution TEXT,
  color TEXT,
  currency TEXT DEFAULT '₹',
  is_archived BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own accounts" ON public.accounts;
CREATE POLICY "Users can manage their own accounts"
  ON public.accounts FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view default or own categories" ON public.categories;
CREATE POLICY "Users can view default or own categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  account_id TEXT NOT NULL,
  to_account_id TEXT,
  category_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  merchant TEXT,
  description TEXT,
  note TEXT,
  payment_method TEXT,
  location_name TEXT,
  location_address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migrations for existing databases
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS location_place_id TEXT;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions"
  ON public.transactions FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
CREATE POLICY "Users can manage their own budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 6. Recurring Payments Table
CREATE TABLE IF NOT EXISTS public.recurring_payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL,
  next_due_date TEXT NOT NULL,
  due_time TEXT,
  account_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  is_paused BOOLEAN DEFAULT FALSE,
  reminder_days_before INTEGER DEFAULT 1,
  note TEXT
);

ALTER TABLE public.recurring_payments ADD COLUMN IF NOT EXISTS due_time TEXT;

ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own recurring payments" ON public.recurring_payments;
CREATE POLICY "Users can manage their own recurring payments"
  ON public.recurring_payments FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 8. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hide_balances BOOLEAN DEFAULT FALSE,
  pin_enabled BOOLEAN DEFAULT FALSE,
  hashed_pin TEXT DEFAULT '',
  currency TEXT DEFAULT '₹',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  demo_mode_loaded BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
