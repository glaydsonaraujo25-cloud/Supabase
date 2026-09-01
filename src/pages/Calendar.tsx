import { tasksIcs, downloadText } from '../lib/exports'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStudy } from '../hooks/useStudy'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { calendarTasks, monthDays } from '../lib/calendar'
import { displayDate, isOverdue, localDate, priorities, type Task } from '../types/study'
import { Field, Loading, Notice, Submit } from '../components/UI'
export default function Calendar() {
 const {session}=useAuth();const data=useStudy();const today=localDate()
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1,12));const [selected,setSelected]=useState(today)
 const [view,setView]=useState('day');const [pendingOnly,setPendingOnly]=useState(false)
 const [editing,setEditing]=useState<Task|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState('')
 const cells=monthDays(month.getFullYear(),month.getMonth());const tasks=calendarTasks(data.tasks,view,selected,today).filter(t=>!pendingOnly||t.status!=='done')
 const title=view==='today'?'Hoje':view==='week'?'Esta semana':view==='overdue'?'Atrasadas':view==='undated'?'Sem prazo':displayDate(selected)
 function move(offset:number){setMonth(current=>new Date(current.getFullYear(),current.getMonth()+offset,1,12))}
 async function update(task:Task,fields:{status?:string;due_date?:string|null}) {
  if(busy||!session)return;setBusy(true);setError('');setSuccess('')
  try{const {error}=await client().from('tasks').update(fields).eq('id',task.id).eq('user_id',session.user.id).select('id').single();if(error)throw error;setEditing(null);setSuccess('Tarefa atualizada.');data.reload()}catch(e){setError(friendlyError(e))}finally{setBusy(false)}
 }
 function reschedule(event:FormEvent<HTMLFormElement>){event.preventDefault();if(editing)update(editing,{due_date:String(new FormData(event.currentTarget).get('due_date'))||null})}
 return <section className="study"><div className="page-title"><div><span className="eyebrow">SEU RITMO DE ESTUDO</span><h1>Calendário</h1><p>Organize seus prazos e acompanhe as próximas atividades.</p></div><Link className="primary inline" to={`/tasks?date=${selected}`}>Nova tarefa</Link></div><Notice error>{error||data.error}</Notice><Notice>{success}</Notice>{data.error&&<button className="secondary" onClick={data.reload}>Tentar novamente</button>}
 <div className="calendar-toolbar"><button className="secondary" aria-label="Mês anterior" onClick={()=>move(-1)}>←</button><h2>{month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h2><button className="secondary" aria-label="Próximo mês" onClick={()=>move(1)}>→</button><button className="text-button" onClick={()=>{setMonth(new Date(`${today.slice(0,7)}-01T12:00:00`));setSelected(today);setView('today')}}>Ir para hoje</button></div>
 <div className="calendar-grid" aria-label="Dias do calendário">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(day=><span className="weekday" key={day}>{day}</span>)}{cells.map(day=>{const count=data.tasks.filter(t=>t.due_date===day.date&&t.status!=='done').length;return <button key={day.date} className={`calendar-day ${day.inMonth?'':'outside'} ${day.date===today?'today':''}`} aria-pressed={selected===day.date&&view==='day'} aria-label={`${displayDate(day.date)}, ${count} tarefas pendentes`} onClick={()=>{setSelected(day.date);setView('day')}}><span>{day.day}</span>{count>0&&<small>{count}<span className="desktop-label"> tarefa{count>1?'s':''}</span></small>}</button>})}</div>
 <div className="calendar-filters">{[['day','Dia selecionado'],['today','Hoje'],['week','Esta semana'],['overdue','Atrasadas'],['undated','Sem prazo']].map(([value,label])=><button className="secondary" aria-pressed={view===value} key={value} onClick={()=>setView(value)}>{label}</button>)}<label className="check-label"><input type="checkbox" checked={pendingOnly} onChange={e=>setPendingOnly(e.target.checked)}/> Apenas pendentes</label></div>
 <div className="section-heading"><h2>{title}</h2><button className="secondary" disabled={data.loading||!!data.error||!tasks.some(t=>t.due_date&&t.status!=='done')} onClick={()=>{try{downloadText(tasksIcs(tasks),'prazos.ics','text/calendar;charset=utf-8');setSuccess('Download solicitado. Importe o arquivo no seu calendário.')}catch{setError('Não foi possível exportar os prazos. Tente novamente.')}}}>Exportar prazos (ICS)</button></div><p className="hint">Exporta tarefas pendentes com prazo desta visualização como eventos de dia inteiro. A importação não sincroniza alterações futuras.</p>{editing&&<form className="study-form" onSubmit={reschedule} key={editing.id}><h3>Reagendar: {editing.title}</h3><fieldset disabled={busy}><Field label="Novo prazo" name="due_date" type="date" defaultValue={editing.due_date??''}/><p>Deixe vazio para remover o prazo.</p><div className="actions"><Submit busy={busy}>Salvar prazo</Submit><button className="secondary" type="button" onClick={()=>setEditing(null)}>Cancelar</button></div></fieldset></form>}
 {data.loading?<Loading/>:!data.error&&(tasks.length?<ul className="study-list">{tasks.map(task=><li key={task.id}><div className="record-main"><input type="checkbox" aria-label={`Concluir ou reabrir ${task.title}`} checked={task.status==='done'} disabled={busy} onChange={()=>update(task,{status:task.status==='done'?'pending':'done'})}/><div><h3>{task.title}</h3><p>{data.courses.find(c=>c.id===task.course_id)?.title??'Sem curso'} · Prioridade {priorities[task.priority].toLowerCase()}</p><span className={isOverdue(task)?'due overdue':'due'}>{task.due_date?displayDate(task.due_date):'Sem prazo'}{isOverdue(task)?' · Atrasada':''}{task.status==='done'?' · Concluída':''}</span></div></div><button className="text-button" disabled={busy} aria-label={`Reagendar ${task.title}`} onClick={()=>{setEditing(task);setError('');setSuccess('')}}>Reagendar</button></li>)}</ul>:<p className="empty">Nenhuma tarefa nesta visualização.</p>)}
 </section>
}
