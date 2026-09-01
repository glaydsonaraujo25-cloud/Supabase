import { Pagination, usePagination } from '../components/Pagination'
import { coursesCsv, tasksCsv, downloadText } from '../lib/exports'
import { Link, useSearchParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useStudy } from '../hooks/useStudy'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { Field, Loading, Notice, Submit } from '../components/UI'
import { courseStatus, priorities, taskStatuses, safeCourseUrl, isOverdue, displayDate, type Course, type Task } from '../types/study'
export default function Study({ mode }: { mode: 'courses' | 'tasks' }) {
  const isCourse = mode === 'courses'; const { session } = useAuth(); const data = useStudy()
  const [params] = useSearchParams()
  const dateParam = params.get('date') ?? ''
  const suggestedDate = !isCourse && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && !Number.isNaN(Date.parse(dateParam)) ? dateParam : ''
  const [editing, setEditing] = useState<Course | Task | 'new' | null>(suggestedDate ? 'new' : null)
  const [deleting, setDeleting] = useState<Course | Task | null>(null)
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all')
  const records = isCourse ? data.courses : data.tasks
  const shown = records.filter(row => row.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')) && (filter === 'all' || (isCourse ? courseStatus((row as Course).progress) : (row as Task).status) === filter))
 const pagination = usePagination(shown, JSON.stringify([query,filter]))
  const current = editing && editing !== 'new' ? editing : null
  function start(row: Course | Task | 'new') { setEditing(row); setDeleting(null); setError(''); setSuccess('') }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !session) return
    const form = new FormData(event.currentTarget); const title = String(form.get('title')).trim()
    if (!title) { setError('Informe um título.'); return }
    setBusy(true); setError(''); setSuccess('')
    try {
      const fields = isCourse ? { title, institution: String(form.get('institution')).trim(), hours: Number(form.get('hours')), progress: Number(form.get('progress')), url: safeCourseUrl(String(form.get('url'))) } : { title, course_id: String(form.get('course_id')) || null, due_date: String(form.get('due_date')) || null, priority: String(form.get('priority')), status: String(form.get('status')) }
      const request = current ? client().from(mode).update(fields).eq('id', current.id).eq('user_id', session.user.id) : client().from(mode).insert({ ...fields, user_id: session.user.id })
      const { error } = await request.select('id').single(); if (error) throw error
      setEditing(null); setSuccess(isCourse ? 'Curso salvo com sucesso.' : 'Tarefa salva com sucesso.'); data.reload()
    } catch (e) { setError(e instanceof Error && e.message === 'invalid_url' ? 'Informe um link válido começando com https:// ou http://.' : friendlyError(e)) }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!deleting || !session || busy) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const { error } = await client().from(mode).delete().eq('id', deleting.id).eq('user_id', session.user.id).select('id').single()
      if (error) throw error
      setDeleting(null); setSuccess(isCourse ? 'Curso e tarefas vinculadas excluídos.' : 'Tarefa excluída.'); data.reload()
    } catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }
  async function toggle(task: Task) {
    if (busy || !session) return; setBusy(true); setError(''); setSuccess('')
    try {
      const { error } = await client().from('tasks').update({ status: task.status === 'done' ? 'pending' : 'done' }).eq('id', task.id).eq('user_id', session.user.id).select('id').single()
      if (error) throw error
      setSuccess(task.status === 'done' ? 'Tarefa reaberta.' : 'Tarefa concluída.'); data.reload()
    } catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }
  return <section className="study"><div className="page-title"><div><span className="eyebrow">CENTRAL DE ESTUDOS</span><h1>{isCourse ? 'Meus cursos' : 'Minhas tarefas'}</h1><p>{isCourse ? 'Organize o que você está aprendendo.' : 'Um passo de cada vez, no seu ritmo.'}</p></div><button className="primary inline" disabled={busy || data.loading || !!data.error} onClick={() => start('new')}><Plus size={18}/>{isCourse ? 'Novo curso' : 'Nova tarefa'}</button></div>
    <Notice error>{error || data.error}</Notice><Notice>{success}</Notice>
    {data.error && <button className="secondary" onClick={data.reload}>Tentar novamente</button>}
    {editing && <form className="study-form" onSubmit={save} key={current?.id ?? 'new'}><h2>{current ? 'Editar' : 'Adicionar'} {isCourse ? 'curso' : 'tarefa'}</h2><fieldset disabled={busy}><Field autoFocus label={isCourse ? 'Nome do curso' : 'Título da tarefa'} name="title" defaultValue={current?.title ?? ''} maxLength={160} required/>
      {isCourse ? <><Field label="Instituição" name="institution" defaultValue={(current as Course)?.institution ?? ''} maxLength={120}/><div className="form-grid"><Field label="Carga horária (horas)" name="hours" type="number" min={0} max={100000} step="0.5" defaultValue={(current as Course)?.hours ?? 0} required/><Field label="Progresso manual (%)" name="progress" type="number" min={0} max={100} step={1} defaultValue={(current as Course)?.manual_progress ?? (current as Course)?.progress ?? 0} required/></div><Field label="Link do curso (opcional)" name="url" type="url" placeholder="https://" defaultValue={(current as Course)?.url ?? ''}/><p className="hint">O valor manual é usado quando o modo automático está desativado. Abra o curso para configurar módulos, aulas e o modo de progresso.</p></> : <><label className="field">Curso (opcional)<select name="course_id" defaultValue={(current as Task)?.course_id ?? ''}><option value="">Sem curso vinculado</option>{data.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label><div className="form-grid"><Field label="Prazo (opcional)" name="due_date" type="date" defaultValue={(current as Task)?.due_date ?? (current ? '' : suggestedDate)}/><label className="field">Prioridade<select name="priority" defaultValue={(current as Task)?.priority ?? 'medium'}>{Object.entries(priorities).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><label className="field">Status<select name="status" defaultValue={(current as Task)?.status ?? 'pending'}>{Object.entries(taskStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></>}
      <div className="actions"><Submit busy={busy}>Salvar {isCourse ? 'curso' : 'tarefa'}</Submit><button type="button" className="secondary" onClick={() => setEditing(null)}>Cancelar</button></div></fieldset></form>}
    {deleting && <div className="delete-confirm" role="alert"><h2>Excluir “{deleting.title}”?</h2><p>{isCourse ? 'As tarefas, módulos, aulas e anotações vinculadas também serão excluídos. Essa ação não pode ser desfeita.' : 'Essa ação não pode ser desfeita.'}</p><div className="actions"><button className="secondary danger" disabled={busy} onClick={remove}>Confirmar exclusão</button><button className="secondary" disabled={busy} onClick={() => setDeleting(null)}>Cancelar</button></div></div>}
    <button className="secondary" disabled={busy || data.loading || !!data.error || !shown.length} onClick={() => { try { downloadText(isCourse ? coursesCsv(shown as Course[]) : tasksCsv(shown as Task[], data.courses), isCourse ? 'cursos.csv' : 'tarefas.csv'); setSuccess('Download solicitado com os resultados filtrados.') } catch { setError('Não foi possível gerar o relatório. Tente novamente.') } }}>Exportar resultados (CSV)</button>
    <div className="filters"><Field label="Buscar por nome" type="search" value={query} onChange={e => setQuery(e.target.value)}/><label className="field">Filtrar por status<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos</option>{(isCourse ? ['Não iniciado', 'Em andamento', 'Concluído'].map(v => [v, v]) : Object.entries(taskStatuses)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {data.loading ? <Loading/> : !data.error && (shown.length ? <ul className="study-list">{pagination.items.map(row => <li key={row.id}><div className="record-main">{!isCourse && <input type="checkbox" aria-label={`Concluir ou reabrir ${row.title}`} checked={(row as Task).status === 'done'} disabled={busy} onChange={() => toggle(row as Task)}/>}<div><h2>{isCourse ? <Link to={`/courses/${row.id}`}>{row.title}</Link> : row.title}</h2>{isCourse ? <><p>{(row as Course).institution || 'Instituição não informada'} · {(row as Course).hours} h</p><div className="progress-line"><progress max={100} value={(row as Course).progress} aria-label={`Progresso de ${row.title}`}/><span>{(row as Course).progress}% · {courseStatus((row as Course).progress)}</span></div>{(row as Course).url && <a href={(row as Course).url!} target="_blank" rel="noopener noreferrer">Abrir curso <ExternalLink size={13}/></a>}</> : <><p>{data.courses.find(c => c.id === (row as Task).course_id)?.title ?? 'Sem curso'} · Prioridade {priorities[(row as Task).priority].toLowerCase()}</p><span className={isOverdue(row as Task) ? 'due overdue' : 'due'}>{taskStatuses[(row as Task).status]} · {(row as Task).due_date ? displayDate((row as Task).due_date!) : 'Sem prazo'}{isOverdue(row as Task) ? ' · Atrasada' : ''}</span></>}</div></div><div className="row-actions"><button className="text-button" disabled={busy} aria-label={`Editar ${row.title}`} onClick={() => start(row)}><Pencil size={17}/></button><button className="text-button" disabled={busy} aria-label={`Excluir ${row.title}`} onClick={() => { setDeleting(row); setEditing(null); setError(''); setSuccess('') }}><Trash2 size={17}/></button></div></li>)}</ul> : <div className="empty"><h2>{records.length ? 'Nenhum resultado encontrado.' : isCourse ? 'Seu próximo aprendizado começa aqui.' : 'Tudo pronto para seu primeiro passo.'}</h2><p>{records.length ? 'Tente outro nome ou filtro.' : isCourse ? 'Adicione seu primeiro curso para acompanhar sua evolução.' : 'Crie uma tarefa e organize seus próximos estudos.'}</p></div>)}
    {!data.loading&&!data.error&&<Pagination {...pagination}/>}
  </section>
}
