import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return '';
};

const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  'https://seerpislmkozvislqwaz.supabase.co';

const supabaseKey =
  getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  'sb_publishable_pKdOdAoEnKbe0B_ODcIQng_uj1vH1M0';

export const supabase = createSupabaseJsClient(supabaseUrl, supabaseKey);

export const createClient = () => supabase;
