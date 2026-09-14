import { createClient as createBrowserClient } from './client';

export const createClient = (request?: any) => {
  try {
    const { createServerClient } = require("@supabase/ssr");
    const { NextResponse } = require("next/server");
    let supabaseResponse = NextResponse.next({
      request: {
        headers: request?.headers || {},
      },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://seerpislmkozvislqwaz.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_pKdOdAoEnKbe0B_ODcIQng_uj1vH1M0';

    createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request?.cookies?.getAll() || [];
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => request?.cookies?.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    return supabaseResponse;
  } catch {
    return createBrowserClient();
  }
};
