import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { client, callbackFailed, callbackLocationKey } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { passwordError } from '../lib/validation'
import { Password, Submit, Notice } from '../components/UI'
import { AuthHeading } from '../components/Layout'
export default function ResetPassword() {
  const location = useLocation()
  const { session, finishRecovery } = useAuth(); const navigate = useNavigate()
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget); const password = String(data.get('password'))
    const invalid = passwordError(password, String(data.get('confirmation'))); setError(invalid); if (invalid) return
    setBusy(true)
    try {
      const { error } = await client().auth.updateUser({ password }); if (error) throw error
      finishRecovery()
      // Supabase invalidates other refresh tokens when the password changes.
      navigate('/dashboard', { replace: true, state: { message: 'Senha atualizada com sucesso.' } })
    } catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }
  return <section className="auth"><AuthHeading title="Uma nova senha." description="Escolha uma senha segura para sua conta."/>{!session || (callbackFailed && location.key === callbackLocationKey) ? <><Notice error>O link é inválido ou expirou. Solicite um novo link para continuar.</Notice><Link to="/forgot-password">Solicitar novo link</Link></> : <><Notice error>{error}</Notice><form onSubmit={submit}><fieldset disabled={busy}><Password label="Nova senha" name="password" autoComplete="new-password" minLength={8} required/><Password label="Confirmar nova senha" name="confirmation" autoComplete="new-password" minLength={8} required/><Submit busy={busy}>Salvar nova senha</Submit></fieldset></form></>}</section>
}
