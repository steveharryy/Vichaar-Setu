// Safe Supabase helper that handles missing configuration gracefully
import type { Database } from '@/integrations/supabase/types';

let supabaseInstance: ReturnType<typeof import('@supabase/supabase-js').createClient<Database>> | null = null;

export const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    console.warn('Supabase not configured - VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing');
    return null;
  }
  
  const { createClient } = await import('@supabase/supabase-js');
  supabaseInstance = createClient<Database>(url, key, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  
  return supabaseInstance;
};

// Check if Supabase is available
export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return !!(url && key);
};
