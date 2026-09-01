import { Link, Outlet } from 'react-router-dom'
import { Layers } from 'lucide-react'
export function Layout() {
  return <div className="shell"><a href="#main" className="skip">Pular para o conteúdo</a><header><Link className="brand" to="/"><Layers size={23}/> minha conta<span className="brand-dot">.</span></Link></header><main id="main" tabIndex={-1}><Outlet/></main><footer>Um espaço para cuidar da sua conta.</footer></div>
}
export function AuthHeading({ title, description }: { title: string; description: string }) {
  return <div className="heading"><span className="eyebrow">SEU ESPAÇO</span><h1>{title}</h1><p>{description}</p></div>
}
