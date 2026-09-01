import { Link } from 'react-router-dom'
import { useStudy } from '../hooks/useStudy'
import { displayDate, isOverdue } from '../types/study'
import { Loading, Notice } from './UI'
export function StudySummary() {
  const { courses, tasks, loading, error, reload } = useStudy()
  if (loading) return <Loading/>
  if (error) return <><Notice error>{error}</Notice><button className="secondary" onClick={reload}>Tentar novamente</button></>
  const completed = tasks.filter(t => t.status === 'done').length
  const upcoming = tasks.filter(t => t.status !== 'done' && t.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!)).slice(0, 5)
  const progress = courses.length ? Math.round(courses.reduce((total, c) => total + c.progress, 0) / courses.length) : 0
  return <div className="study-summary"><div className="stats"><div><strong>{courses.filter(c => c.progress > 0 && c.progress < 100).length}</strong><span>Cursos em andamento</span></div><div><strong>{tasks.length - completed}</strong><span>Tarefas pendentes</span></div><div><strong>{progress}%</strong><span>Progresso médio dos cursos</span></div></div><div className="summary-links"><Link to="/focus">Meu ritmo →</Link><Link to="/courses">Meus cursos →</Link><Link to="/tasks">Minhas tarefas →</Link><Link to="/calendar">Calendário →</Link><Link to="/certificates">Certificados →</Link></div><h2>Próximos prazos</h2>{upcoming.length ? <ul className="deadline-list">{upcoming.map(t => <li key={t.id}><Link to="/tasks">{t.title}</Link><span className={isOverdue(t) ? 'overdue' : ''}>{displayDate(t.due_date!)}{isOverdue(t) ? ' · Atrasada' : ''}</span></li>)}</ul> : <p>Nenhuma tarefa com prazo pendente. Organize seus próximos estudos em Tarefas.</p>}<p>{courses.filter(c => c.progress === 100).length} cursos concluídos · {completed} tarefas concluídas</p></div>
}
