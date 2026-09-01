import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import type { Profile } from '../types/profile'
export function useProfile() {
  const { session } = useAuth(); const id = session?.user.id
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(n => n + 1), [])
  useEffect(() => {
    let active = true; setProfile(null); setError(''); setLoading(true)
    if (!id) { setLoading(false); return }
    Promise.resolve(client().from('profiles').select('*').eq('id', id).single()).then(({ data, error }) => {
      if (!active) return
      if (error) setError('Não foi possível carregar seu perfil. Tente novamente.'); else setProfile(data)
      setLoading(false)
    }).catch(e => { if (active) { setError(friendlyError(e)); setLoading(false) } })
    return () => { active = false }
  }, [id, attempt])
  return { profile, setProfile, loading, error, retry }
}
// Download through authenticated Storage. No public or permanent avatar URL is exposed.
export function useAvatar(path?: string | null) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let active = true; let objectUrl: string | undefined; setSrc(null)
    if (path) client().storage.from('avatars').download(path).then(({ data }) => {
      if (data && active) { objectUrl = URL.createObjectURL(data); setSrc(objectUrl) }
    }).catch(() => { /* Keep the accessible placeholder when an avatar is unavailable. */ })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [path])
  return src
}
