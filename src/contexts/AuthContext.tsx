import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
interface AuthState { session: Session | null; loading: boolean; recovery: boolean; finishRecovery: () => void }
const AuthContext = createContext<AuthState | undefined>(undefined)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!!supabase)
  const [recovery, setRecovery] = useState(false)
  useEffect(() => {
    if (!supabase) return
    let eventReceived = false
    // Subscribe before initialization resolves. Keep this callback synchronous.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      eventReceived = true
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !eventReceived) { if (error) setSession(null); else setSession(data.session); setLoading(false) }
    }).catch(() => { if (active && !eventReceived) { setSession(null); setLoading(false) } })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  return <AuthContext.Provider value={{ session, loading, recovery, finishRecovery: () => setRecovery(false) }}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const state = useContext(AuthContext)
  if (!state) throw new Error('AuthProvider missing')
  return state
}
