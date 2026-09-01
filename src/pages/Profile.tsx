import { StorageCleanup } from '../components/StorageCleanup'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile, useAvatar } from '../hooks/useProfile'
import { saveProfile } from '../lib/profile'
import { avatarError } from '../lib/validation'
import { friendlyError } from '../lib/errors'
import { Avatar, Field, Submit, Notice, Loading } from '../components/UI'
export default function ProfilePage() {
  const { session } = useAuth(); const { profile, setProfile, loading, error: loadError, retry } = useProfile()
  const avatar = useAvatar(profile?.avatar_url)
  const [name, setName] = useState(''); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  useEffect(() => { if (profile) setName(profile.full_name) }, [profile])
  useEffect(() => { if (!file) { setPreview(null); return }; const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url) }, [file])
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!session || !profile) return
    setSuccess(''); setError('')
    if (!name.trim()) { setError('Informe seu nome completo.'); return }
    if (file) { const invalid = avatarError(file); if (invalid) { setError(invalid); return } }
    setBusy(true)
    try {
      const result = await saveProfile(session.user.id, name.trim(), profile.avatar_url, file)
      setProfile(result.profile); setFile(null)
      setSuccess(result.cleanupFailed ? 'Perfil atualizado. A foto anterior não pôde ser removida do armazenamento.' : 'Perfil atualizado com sucesso.')
    } catch (e) { setError(friendlyError(e)) }
    finally { setBusy(false) }
  }
  return <section className="account profile"><Link className="back" to="/dashboard"><ArrowLeft size={17}/> Voltar para minha conta</Link><h1>Seu perfil, do seu jeito.</h1><p>Atualize como você aparece na sua conta.</p>{loading ? <Loading/> : loadError ? <><Notice error>{loadError}</Notice><button className="secondary" onClick={retry}>Tentar novamente</button></> : <form onSubmit={save}><Notice error>{error}</Notice><Notice>{success}</Notice><fieldset disabled={busy}><div className="avatar-editor"><Avatar src={preview ?? avatar} name={name}/><div><label className="secondary upload"><Upload size={17}/> Escolher foto<input type="file" aria-label="Escolher foto de perfil" accept="image/jpeg,image/png,image/webp" onChange={e => { const next = e.target.files?.[0]; e.target.value = ''; if (!next) return; const invalid = avatarError(next); setError(invalid); setSuccess(''); if (!invalid) setFile(next) }}/></label><p className="hint">JPG, PNG ou WebP. Até 2 MB.</p>{file && <button type="button" className="text-button" onClick={() => setFile(null)}>Cancelar seleção</button>}</div></div><Field label="Nome completo" value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={120} required/><Field label="E-mail" value={session?.user.email ?? ''} type="email" readOnly/><p className="hint">O e-mail é usado para acessar sua conta.</p><Submit busy={busy}>Salvar alterações</Submit></fieldset></form>}{!loading&&!loadError&&<StorageCleanup/>}</section>
}
