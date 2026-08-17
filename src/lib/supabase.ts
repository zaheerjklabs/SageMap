import { createClient } from '@supabase/supabase-js';

// Default project configuration to ensure online deployment (Vercel) connects smoothly
const DEFAULT_SUPABASE_URL = 'https://hiwotginlufpiorvyddu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable__t-xihpRheZNMWskvARjWg_R6Ntkcie';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key'
);

/**
 * Returns the current application URL dynamically for auth email redirects.
 * Ensures redirects land on the active origin (e.g., https://sage-map-six.vercel.app)
 */
export function getAppRedirectUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://sage-map-six.vercel.app';
}
