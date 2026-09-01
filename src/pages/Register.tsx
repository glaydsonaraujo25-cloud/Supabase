import { Captcha, useCaptcha } from '../components/Captcha'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { passwordError, validEmail } from '../lib/validation'
import { Field, Password, Submit, Notice } from '../components/UI'
import { AuthHeading } from '../components/Layout'
export default function Register() {
  const captcha = useCaptcha()
  const { session } = useAuth(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(false)
  const [blockedEmail, setBlockedEmail] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const blocked = !!blockedEmail && emailValue.trim().toLowerCase() === blockedEmail
  if (session) return <Navigate to="/dashboard" replace/>
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!captcha.token || busy) return; if (blocked || busy) return; const form = e.currentTarget; const data = new FormData(form)
    const name = String(data.get('name')).trim(), email = String(data.get('email')).trim(), password = String(data.get('password'))
    const invalid = !name ? 'Informe seu nome completo.' : !validEmail(email) ? 'Informe um e-mail válido.' : passwordError(password, String(data.get('confirmation')))
    setError(invalid); if (invalid) return
    setBusy(true)
    try {
      const { data: result, error } = await client().auth.signUp({ email, password, options: { captchaToken: captcha.token, data: { full_name: name }, emailRedirectTo: `${window.location.origin}/login` } })
      if (error?.code === 'user_already_exists' || error?.code === 'email_exists' ||
          (!error && !result.session && result.user?.identities?.length === 0)) {
        setBlockedEmail(email.toLowerCase())
        setError('Este e-mail já está cadastrado.')
        return
      }
      if (error) throw error
      setSuccess(true); form.reset()
    } catch (e) { setError(friendlyError(e)) } finally { captcha.reset(); setBusy(false) }
  }
  return <section className="auth"><AuthHeading title="Comece por aqui." description="Crie sua conta em poucos passos."/><Notice error>{error}</Notice>{blocked && <p className="auth-bottom"><Link to="/login">Entrar na minha conta</Link> ou <Link to="/forgot-password">Recuperar senha</Link></p>}{success ? <Notice>Confira seu e-mail para confirmar o cadastro. Se você já possui uma conta, entre ou recupere sua senha.</Notice> : <form onSubmit={submit}><fieldset disabled={busy}><Field label="Nome completo" name="name" autoComplete="name" maxLength={120} required/><Field label="E-mail" name="email" type="email" value={emailValue} onChange={e => { setEmailValue(e.target.value); setError(e.target.value.trim().toLowerCase() === blockedEmail ? 'Este e-mail já está cadastrado.' : '') }} autoComplete="email" required/><Password name="password" autoComplete="new-password" minLength={8} required/><p className="hint">Use pelo menos 8 caracteres.</p><Password label="Confirmar senha" name="confirmation" autoComplete="new-password" minLength={8} required/><Captcha state={captcha}/><Submit busy={busy} disabled={blocked || !captcha.token}>Criar conta</Submit></fieldset></form>}<p className="auth-bottom">Já tem uma conta? <Link to="/login">Entrar</Link></p></section>
}
