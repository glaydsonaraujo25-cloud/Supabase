import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, LoaderCircle, UserRound } from 'lucide-react'
export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId()
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} {...props}/></div>
}
export function Password({ label = 'Senha', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const id = useId(); const [show, setShow] = useState(false)
  return <div className="field"><label htmlFor={id}>{label}</label><div className="password"><input id={id} {...props} type={show ? 'text' : 'password'}/><button type="button" aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></div>
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return children ? <p className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>{children}</p> : null
}
export function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return <button className="primary" disabled={busy} type="submit">{busy && <LoaderCircle className="spin" size={18}/>} {busy ? 'Aguarde…' : children}</button>
}
export function Loading() { return <p className="loading" role="status"><LoaderCircle className="spin" size={22}/> Carregando…</p> }
export function Avatar({ src, name }: { src?: string | null; name: string }) {
  return <div className="avatar">{src ? <img src={src} alt={`Foto de ${name}`} onError={e => { e.currentTarget.style.display = 'none' }}/>: <UserRound size={36}/>}</div>
}
