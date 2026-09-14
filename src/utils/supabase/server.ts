import { createClient as createBrowserClient } from './client';

export const createClient = (cookieStore?: any) => {
  try {
    const { createServerClient } = require("@supabase/ssr");
    const { cookies } = require("next/headers");
    const store = cookieStore || cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://seerpislmkozvislqwaz.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_pKdOdAoEnKbe0B_ODcIQng_uj1vH1M0';

    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server Component ignore
          }
        },
      },
    });
  } catch {
    // Fallback for non-Next environments (e.g. Vite)
    return createBrowserClient();
  }
};
