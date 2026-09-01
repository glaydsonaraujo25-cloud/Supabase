import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { client, callbackFailed } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { Field, Password, Submit, Notice } from '../components/UI'
import { AuthHeading } from '../components/Layout'
export default function Login() {
  const { session, recovery } = useAuth(); const location = useLocation()
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  if (session) return <Navigate to={recovery ? '/reset-password' : '/dashboard'} replace/>
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(true); setError('')
    try { const { error } = await client().auth.signInWithPassword({ email: String(data.get('email')).trim(), password: String(data.get('password')) }); if (error) throw error }
    catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }
  return <section className="auth"><AuthHeading title="Que bom ter você aqui." description="Entre para acessar e cuidar do seu perfil."/><Notice>{location.state?.message}</Notice><Notice error>{callbackFailed ? 'Este link é inválido ou expirou. Solicite um novo link.' : error}</Notice><form onSubmit={submit}><fieldset disabled={busy}><Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required/><Password name="password" autoComplete="current-password" required/><div className="form-link"><Link to="/forgot-password">Esqueci minha senha</Link></div><Submit busy={busy}>Entrar</Submit></fieldset></form><p className="auth-bottom">Ainda não tem uma conta? <Link to="/register">Criar conta</Link></p></section>
}
