-- Spendly Database Migration: Add due_time column to recurring_payments table
-- Run this script in the Supabase SQL Editor for your project

ALTER TABLE public.recurring_payments 
ADD COLUMN IF NOT EXISTS due_time TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
