import { createClient } from '@supabase/supabase-js'
import { isPublicKey, validSupabaseUrl } from './validation'
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
export const configured = validSupabaseUrl(url) && isPublicKey(key)
// Never use secret/service_role keys here. VITE_* variables are public.
export const supabase = configured ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
}) : null
export function client() {
  if (!supabase) throw new Error('configuration_missing')
  return supabase
}
// Capture callback errors before the SDK removes URL parameters.
const callback = new URLSearchParams(window.location.hash.slice(1))
export const callbackFailed = callback.has('error') || new URLSearchParams(window.location.search).has('error')

export const callbackLocationKey: string = window.history.state?.key ?? 'default'
