import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfiguration } from '../utils/environment'

export const supabase: SupabaseClient | null = supabaseConfiguration.isConfigured
  ? createClient(supabaseConfiguration.url, supabaseConfiguration.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      supabaseConfiguration.issue ?? 'La connexion à Supabase n’est pas configurée.',
    )
  }

  return supabase
}
