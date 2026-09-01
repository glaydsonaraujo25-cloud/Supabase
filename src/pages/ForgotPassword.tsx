import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { Field, Submit, Notice } from '../components/UI'
import { AuthHeading } from '../components/Layout'
export default function ForgotPassword() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const email = String(new FormData(e.currentTarget).get('email')).trim(); setBusy(true); setError('')
    try { const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; setSent(true) }
    catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }
  return <section className="auth"><AuthHeading title="Vamos recuperar seu acesso." description="Informe o e-mail usado na sua conta."/><Notice error>{error}</Notice>{sent ? <Notice>Se houver uma conta com esse e-mail, você receberá um link para definir uma nova senha. Confira também o spam.</Notice> : <form onSubmit={submit}><fieldset disabled={busy}><Field label="E-mail" name="email" type="email" autoComplete="email" required/><Submit busy={busy}>Enviar link de recuperação</Submit></fieldset></form>}<p className="auth-bottom"><Link to="/login">Voltar para entrar</Link></p></section>
}
