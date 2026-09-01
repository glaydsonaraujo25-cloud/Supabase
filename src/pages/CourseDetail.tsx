import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { Field, Loading, Notice, Submit } from '../components/UI'
import { displayDate, type Course, type Task } from '../types/study'
interface Module { id: string; title: string; position: number }
interface Lesson extends Module { module_id: string; completed: boolean }
interface Note { id: string; title: string; body: string }
type Kind = 'module' | 'lesson' | 'note'
type Editor = { kind: Kind; id?: string; title: string; body?: string; module_id?: string; position?: number }
const tables = { module: 'course_modules', lesson: 'course_lessons', note: 'course_notes' }
const names = { module: 'módulo', lesson: 'aula', note: 'anotação' }
export default function CourseDetail() {
  const { courseId } = useParams()
  return <CourseWorkspace key={courseId} courseId={courseId ?? ''}/>
}
export function CourseWorkspace({ courseId }: { courseId: string }) {
  const { session } = useAuth(); const owner = session!.user.id
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([]); const [lessons, setLessons] = useState<Lesson[]>([]); const [notes, setNotes] = useState<Note[]>([]); const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(''); const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState<Editor | null>(null); const [deleting, setDeleting] = useState<Editor | null>(null)
  const [settings, setSettings] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  useEffect(() => {
    let active = true; setLoading(true); setLoadError('')
    const scoped = (table: string) => client().from(table).select('*').eq('user_id', owner).eq('course_id', courseId)
    Promise.all([
      client().from('study_courses').select('*').eq('id', courseId).eq('user_id', owner).maybeSingle(),
      scoped('course_modules').order('position').order('created_at'), scoped('course_lessons').order('position').order('created_at'),
      scoped('course_notes').order('created_at', { ascending: false }), scoped('tasks').order('due_date', { nullsFirst: false }),
    ]).then(([c,m,l,n,t]) => {
      if (!active) return
      const failure = [c,m,l,n,t].find(result => result.error)?.error; if (failure) throw failure
      setCourse(c.data); setModules(m.data!); setLessons(l.data!); setNotes(n.data!); setTasks(t.data!)
    }).catch(e => { if (active) setLoadError(friendlyError(e)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId, owner, revision])
  function open(value: Editor) { setEditor(value); setDeleting(null); setSettings(false); setError(''); setSuccess('') }
  async function mutate(action: () => PromiseLike<{ error: unknown }>, message: string) {
    if (busy) return
    setBusy(true); setError(''); setSuccess('')
    try { const { error } = await action(); if (error) throw error; setEditor(null); setDeleting(null); setSettings(false); setSuccess(message); setRevision(n => n + 1) }
    catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editor) return
    const data = new FormData(event.currentTarget); const title = String(data.get('title')).trim()
    if (!title) { setError('Informe um título.'); return }
    const fields = editor.kind === 'note' ? { title, body: String(data.get('body')) } : { title, position: Number(data.get('position')) }
    mutate(() => {
      const table = client().from(tables[editor.kind])
      return (editor.id ? table.update(fields).eq('id', editor.id).eq('user_id', owner).eq('course_id', courseId) : table.insert({ ...fields, user_id: owner, course_id: courseId, ...(editor.kind === 'lesson' ? { module_id: editor.module_id } : {}) })).select('id').single()
    }, 'Alterações salvas.')
  }
  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    mutate(() => client().from('courses').update({ description: String(data.get('description')), auto_progress: data.get('auto_progress') === 'on', progress: Number(data.get('progress')) }).eq('id', courseId).eq('user_id', owner).select('id').single(), 'Preferências atualizadas.')
  }
  if (loading) return <Loading/>
  if (loadError) return <section className="study"><Notice error>{loadError}</Notice><button className="secondary" onClick={() => setRevision(n => n+1)}>Tentar novamente</button><p><Link to="/courses">Voltar aos cursos</Link></p></section>
  if (!course) return <section className="study"><h1>Curso não encontrado.</h1><p>Ele pode ter sido excluído ou não estar disponível para sua conta.</p><Link to="/courses">Voltar aos cursos</Link></section>
  return <section className="study course-detail"><Link className="back" to="/courses">← Meus cursos</Link><div className="page-title"><div><span className="eyebrow">SEU ESPAÇO DE APRENDIZADO</span><h1>{course.title}</h1><p>{course.institution || 'Estudo independente'} · {course.hours} h</p></div><button className="secondary" disabled={busy} onClick={() => { setSettings(true); setEditor(null); setDeleting(null) }}>Preferências do curso</button></div>
    <p className="note-body">{course.description || 'Adicione uma descrição nas preferências para registrar seu objetivo.'}</p><div className="course-progress"><progress max={100} value={course.progress} aria-label="Progresso do curso"/><strong>{course.progress}%</strong><span>{course.auto_progress ? 'Automático pelas aulas' : 'Progresso manual'} · {lessons.filter(l=>l.completed).length}/{lessons.length} aulas concluídas</span></div>
    <Notice error>{error}</Notice><Notice>{success}</Notice>
    {settings && <form className="study-form" onSubmit={saveSettings}><h2>Preferências do curso</h2><fieldset disabled={busy}><label>Descrição<textarea name="description" maxLength={5000} defaultValue={course.description}/></label><label className="check-label"><input type="checkbox" name="auto_progress" defaultChecked={course.auto_progress}/> Calcular progresso automaticamente pelas aulas</label><Field label="Progresso manual (%)" name="progress" type="number" min={0} max={100} step={1} defaultValue={course.manual_progress ?? course.progress} required/><p>O valor manual fica guardado. No modo automático, um curso sem aulas fica em 0%.</p><div className="actions"><Submit busy={busy}>Salvar preferências</Submit><button type="button" className="secondary" onClick={()=>setSettings(false)}>Cancelar</button></div></fieldset></form>}
    {editor && <form className="study-form" key={`${editor.kind}-${editor.id ?? editor.module_id ?? 'new'}`} onSubmit={save}><h2>{editor.id ? 'Editar' : 'Adicionar'} {names[editor.kind]}</h2><fieldset disabled={busy}><Field label="Título" name="title" autoFocus defaultValue={editor.title} maxLength={160} required/>{editor.kind === 'note' ? <label>Conteúdo<textarea name="body" defaultValue={editor.body ?? ''} maxLength={20000} rows={8}/></label> : <Field label="Ordem" name="position" type="number" min={0} step={1} defaultValue={editor.position ?? 0} required/>}<div className="actions"><Submit busy={busy}>Salvar</Submit><button type="button" className="secondary" onClick={()=>setEditor(null)}>Cancelar</button></div></fieldset></form>}
    {deleting && <div className="delete-confirm" role="alert"><h2>Excluir “{deleting.title}”?</h2><p>{deleting.kind === 'module' ? 'As aulas deste módulo também serão excluídas e o progresso automático será recalculado.' : 'Esta ação não pode ser desfeita.'}</p><div className="actions"><button className="secondary danger" disabled={busy} onClick={()=>mutate(()=>client().from(tables[deleting.kind]).delete().eq('id',deleting.id!).eq('user_id',owner).eq('course_id',courseId).select('id').single(),'Item excluído.')}>Confirmar exclusão</button><button className="secondary" disabled={busy} onClick={()=>setDeleting(null)}>Cancelar</button></div></div>}
    <div className="section-heading"><h2>Módulos e aulas</h2><button className="secondary" disabled={busy} onClick={()=>open({kind:'module',title:'',position:modules.length+1})}>Novo módulo</button></div>
    {!modules.length && <p className="empty">Crie o primeiro módulo e adicione as aulas que deseja estudar.</p>}
    {modules.map(m=><section className="module" key={m.id}><div className="section-heading"><h3>{m.title}</h3><div className="actions"><button disabled={busy} className="text-button" onClick={()=>open({...m,kind:'module'})}>Editar módulo</button><button disabled={busy} className="text-button danger" onClick={()=>setDeleting({...m,kind:'module'})}>Excluir módulo</button></div></div><ul className="lesson-list">{lessons.filter(l=>l.module_id===m.id).map(l=><li key={l.id}><label className="check-label"><input type="checkbox" checked={l.completed} disabled={busy} onChange={()=>mutate(()=>client().from('course_lessons').update({completed:!l.completed}).eq('id',l.id).eq('user_id',owner).eq('course_id',courseId).select('id').single(),l.completed?'Aula reaberta.':'Aula concluída.')}/>{l.title}</label><div className="actions"><button className="text-button" disabled={busy} aria-label={`Editar aula ${l.title}`} onClick={()=>open({...l,kind:'lesson'})}>Editar</button><button className="text-button danger" disabled={busy} aria-label={`Excluir aula ${l.title}`} onClick={()=>setDeleting({...l,kind:'lesson'})}>Excluir</button></div></li>)}</ul><button className="text-button" disabled={busy} onClick={()=>open({kind:'lesson',title:'',module_id:m.id,position:lessons.filter(l=>l.module_id===m.id).length+1})}>+ Adicionar aula</button></section>)}
    <div className="section-heading"><h2>Anotações</h2><button className="secondary" disabled={busy} onClick={()=>open({kind:'note',title:'',body:''})}>Nova anotação</button></div>{!notes.length && <p>Guarde resumos, dúvidas e referências deste curso.</p>}{notes.map(n=><article className="course-note" key={n.id}><h3>{n.title}</h3><p className="note-body">{n.body || 'Sem conteúdo.'}</p><div className="actions"><button className="text-button" disabled={busy} onClick={()=>open({...n,kind:'note'})}>Editar anotação</button><button className="text-button danger" disabled={busy} onClick={()=>setDeleting({...n,kind:'note'})}>Excluir anotação</button></div></article>)}
    <div className="section-heading"><h2>Tarefas do curso</h2><Link to="/tasks">Gerenciar tarefas →</Link></div>{tasks.length ? <ul className="deadline-list">{tasks.map(t=><li key={t.id}><span>{t.title}</span><span>{t.status==='done'?'Concluída':t.due_date?displayDate(t.due_date):'Sem prazo'}</span></li>)}</ul>:<p>Nenhuma tarefa vinculada. Escolha este curso ao criar uma tarefa.</p>}
  </section>
}
