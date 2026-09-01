import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { configured } from './lib/supabase'
import { Layout } from './components/Layout'
import { Loading } from './components/UI'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
function ProtectedRoute() {
  const { session } = useAuth()
  return session ? <Outlet key={session.user.id}/> : <Navigate to="/login" replace state={{ message: 'Entre na sua conta para continuar.' }}/>
}
export default function App() {
  const { loading, recovery } = useAuth(); const location = useLocation()
  useEffect(() => { window.scrollTo(0, 0); document.getElementById('main')?.focus() }, [location.pathname])
  if (!configured) return <div className="auth"><h1>Vamos configurar sua conta.</h1><p>Preencha as variáveis de ambiente do Supabase conforme o README e reinicie a aplicação.</p></div>
  if (loading) return <Loading/>
  if (recovery && location.pathname !== '/reset-password') return <Navigate to="/reset-password" replace/>
  return <Routes><Route element={<Layout/>}><Route index element={<Navigate to="/dashboard" replace/>}/><Route path="login" element={<Login/>}/><Route path="register" element={<Register/>}/><Route path="forgot-password" element={<ForgotPassword/>}/><Route path="reset-password" element={<ResetPassword/>}/><Route element={<ProtectedRoute/>}><Route path="dashboard" element={<Dashboard/>}/><Route path="profile" element={<Profile/>}/></Route><Route path="*" element={<section className="auth"><h1>Página não encontrada.</h1><a href="/">Voltar ao início</a></section>}/></Route></Routes>
}
