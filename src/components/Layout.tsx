import { ThemePicker } from './ThemePicker'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Layers } from 'lucide-react'
export function Layout() {
  const { session } = useAuth()
  return <div className="shell"><a href="#main" className="skip">Pular para o conteúdo</a><header><Link className="brand" to="/"><Layers size={23}/> meus estudos<span className="brand-dot">.</span></Link>{session && <nav aria-label="Navegação principal"><NavLink to="/dashboard">Resumo</NavLink><NavLink to="/courses">Cursos</NavLink><NavLink to="/tasks">Tarefas</NavLink><NavLink to="/calendar">Calendário</NavLink><NavLink to="/certificates">Certificados</NavLink><NavLink to="/focus">Meu ritmo</NavLink><NavLink to="/profile">Perfil</NavLink></nav>}</header><main id="main" tabIndex={-1}><Outlet/></main><footer><ThemePicker/><p>Um espaço para aprender e evoluir.</p></footer></div>
}
export function AuthHeading({ title, description }: { title: string; description: string }) {
  return <div className="heading"><span className="eyebrow">SEU ESPAÇO</span><h1>{title}</h1><p>{description}</p></div>
}
