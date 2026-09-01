import { StudySummary } from '../components/StudySummary'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile, useAvatar } from '../hooks/useProfile'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { Avatar, Loading, Notice } from '../components/UI'
export default function Dashboard() {
  const { session } = useAuth(); const { profile, loading, error, retry } = useProfile()
  const avatar = useAvatar(profile?.avatar_url); const location = useLocation(); const navigate = useNavigate()
  const [busy, setBusy] = useState(false); const [logoutError, setLogoutError] = useState('')
  async function logout() {
    setBusy(true); setLogoutError('')
    try { const { error } = await client().auth.signOut({ scope: 'local' }); if (error) throw error; navigate('/login', { replace: true, state: { message: 'Você saiu da sua conta.' } }) }
    catch (e) { setLogoutError(friendlyError(e)) } finally { setBusy(false) }
  }
  return <section className="account"><div className="account-top"><span className="eyebrow">SEUS ESTUDOS</span><button className="text-button" onClick={logout} disabled={busy}><LogOut size={17}/>{busy ? 'Saindo…' : 'Sair'}</button></div><Notice>{location.state?.message}</Notice><Notice error>{logoutError}</Notice>{loading ? <Loading/> : error ? <><Notice error>{error}</Notice><button className="secondary" onClick={retry}>Tentar novamente</button></> : <><div className="welcome"><Avatar src={avatar} name={profile?.full_name || 'usuário'}/><h1>Olá, {profile?.full_name || 'boas-vindas'}<span className="brand-dot">.</span></h1><p>Seu aprendizado, um passo de cada vez.</p></div><StudySummary/><div className="details"><h2>Seu perfil</h2><dl><div><dt>Nome completo</dt><dd>{profile?.full_name}</dd></div><div><dt>E-mail</dt><dd>{session?.user.email}</dd></div><div><dt>Conta criada em</dt><dd>{new Date(session!.user.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div></dl><Link className="primary inline" to="/profile">Editar perfil <ArrowUpRight size={18}/></Link></div></>}</section>
}
