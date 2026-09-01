import { certificatesCsv, downloadText } from '../lib/exports'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { certificateFileError, uploadCertificate, deleteCertificate, type Certificate, type CertificateFields } from '../lib/certificates'
import { type Course, displayDate } from '../types/study'
import { Field, Loading, Notice, Submit } from '../components/UI'
function FilePreview({ certificate, onClose }: {certificate: Certificate; onClose:()=>void}) {
 const [url,setUrl]=useState(''); const [error,setError]=useState('')
 useEffect(()=>{
  let active=true;let objectUrl=''
  client().storage.from('certificates').download(certificate.file_path).then(({data,error})=>{
   if(!active)return; if(error || !data){setError('Não foi possível abrir o arquivo. Feche e tente novamente.');return}
   objectUrl=URL.createObjectURL(new Blob([data],{type:certificate.mime_type}));setUrl(objectUrl)
  }).catch(()=>{if(active)setError('Não foi possível baixar o arquivo. Verifique sua conexão.')})
  return ()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[certificate.file_path,certificate.mime_type])
 return <section className="file-preview" aria-label="Visualização do certificado"><div className="section-heading"><h2>{certificate.title}</h2><button type="button" className="secondary" onClick={onClose}>Fechar visualização</button></div><Notice error>{error}</Notice>{!url&&!error?<Loading/>:url?<><a className="secondary" href={url} download={certificate.file_name}>Baixar arquivo</a>{certificate.mime_type==='application/pdf'?<><p>Se o PDF não aparecer no seu navegador, use “Baixar arquivo”.</p><iframe title={`Certificado ${certificate.title}`} src={url} sandbox=""/></>:<img src={url} alt={`Certificado ${certificate.title}`}/>}</>:null}</section>
}
export default function Certificates() {
 const {session}=useAuth();const owner=session!.user.id;const [params]=useSearchParams()
 const [records,setRecords]=useState<Certificate[]>([]);const [courses,setCourses]=useState<Course[]>([])
 const [loading,setLoading]=useState(true);const [loadError,setLoadError]=useState('');const [revision,setRevision]=useState(0)
 const [editing,setEditing]=useState<Certificate|'new'|null>(null);const [deleting,setDeleting]=useState<Certificate|null>(null);const [preview,setPreview]=useState<Certificate|null>(null)
 const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState('')
 const [query,setQuery]=useState('');const [courseFilter,setCourseFilter]=useState(params.get('course')??'all')
 useEffect(()=>{
  let active=true;setLoading(true);setLoadError('')
  Promise.all([client().from('certificates').select('*').eq('user_id',owner).order('created_at',{ascending:false}),client().from('study_courses').select('*').eq('user_id',owner).order('title')]).then(([c,k])=>{
   if(!active)return;if(c.error||k.error)throw c.error??k.error;setRecords(c.data);setCourses(k.data)
  }).catch(e=>{if(active)setLoadError(friendlyError(e))}).finally(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[owner,revision])
 const current=editing&&editing!=='new'?editing:null
 const shown=records.filter(c=>(courseFilter==='all'||c.course_id===courseFilter||(courseFilter==='none'&&!c.course_id))&&`${c.title} ${c.institution}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
 function start(value: Certificate|'new') {setEditing(value);setFile(null);setDeleting(null);setPreview(null);setError('');setSuccess('')}
 async function save(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();if(busy)return;const data=new FormData(event.currentTarget)
  const fields: CertificateFields={title:String(data.get('title')).trim(),institution:String(data.get('institution')).trim(),hours:Number(data.get('hours')),issued_on:String(data.get('issued_on'))||null,course_id:String(data.get('course_id'))||null}
  if(!fields.title){setError('Informe o título do certificado.');return}
  if(!current&&!file){setError('Selecione o arquivo do certificado.');return}
  const invalid=file?certificateFileError(file):'';if(invalid){setError(invalid);return}
  setBusy(true);setError('');setSuccess('')
  try {
   if(current){const {error}=await client().from('certificates').update(fields).eq('id',current.id).eq('user_id',owner).select('id').single();if(error)throw error}
   else await uploadCertificate(owner,fields,file!)
   setEditing(null);setFile(null);setSuccess('Certificado salvo na sua biblioteca.');setRevision(n=>n+1)
  }catch(e){setError(e instanceof Error&&['O arquivo não parece ser um PDF válido.','invalid_image'].includes(e.message)?'Não foi possível abrir esse arquivo. Escolha um PDF ou imagem válido.':friendlyError(e))}finally{setBusy(false)}
 }
 async function remove() {
  if(!deleting||busy)return;setBusy(true);setError('');setSuccess('')
  try {const cleaned=await deleteCertificate(deleting,owner);setDeleting(null);setPreview(null);setSuccess(cleaned?'Certificado excluído.':'Registro excluído, mas o arquivo não pôde ser removido do armazenamento.');setRevision(n=>n+1)}catch(e){setError(friendlyError(e))}finally{setBusy(false)}
 }
 return <section className="study"><div className="page-title"><div><span className="eyebrow">SUAS CONQUISTAS</span><h1>Certificados</h1><p>Guarde seus comprovantes de aprendizado em um espaço privado.</p></div><button className="primary inline" disabled={loading||busy||!!loadError} onClick={()=>start('new')}>Adicionar certificado</button></div><Notice error>{error||loadError}</Notice><Notice>{success}</Notice>{loadError&&<button className="secondary" onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button>}
 {editing&&<form className="study-form" onSubmit={save} key={current?.id??'new'}><h2>{current?'Editar certificado':'Novo certificado'}</h2><fieldset disabled={busy}><Field label="Título do certificado" name="title" defaultValue={current?.title??''} required maxLength={160}/><Field label="Instituição" name="institution" defaultValue={current?.institution??''} maxLength={120}/><div className="form-grid"><Field label="Carga horária (horas)" name="hours" type="number" min={0} max={100000} step="0.5" defaultValue={current?.hours??0} required/><Field label="Data de emissão (opcional)" name="issued_on" type="date" defaultValue={current?.issued_on??''}/></div><label className="field">Curso vinculado (opcional)<select name="course_id" defaultValue={current?.course_id??(courses.some(c=>c.id===courseFilter)?courseFilter:'')}><option value="">Sem curso vinculado</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>{!current&&<><Field label="Arquivo do certificado" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>{const next=e.target.files?.[0]??null;const issue=next?certificateFileError(next):'';setError(issue);setFile(issue?null:next);if(issue)e.target.value=''}} required/><p>PDF, JPG, PNG ou WebP, até 10 MB. {file?.name}</p></>}<div className="actions"><Submit busy={busy}>Salvar certificado</Submit><button className="secondary" type="button" onClick={()=>{setEditing(null);setFile(null)}}>Cancelar</button></div></fieldset></form>}
 {deleting&&<div className="delete-confirm" role="alert"><h2>Excluir “{deleting.title}”?</h2><p>O registro e o arquivo serão removidos. Essa ação não pode ser desfeita.</p><div className="actions"><button className="secondary danger" disabled={busy} onClick={remove}>Confirmar exclusão</button><button className="secondary" disabled={busy} onClick={()=>setDeleting(null)}>Cancelar</button></div></div>}
 {preview&&<FilePreview key={preview.id} certificate={preview} onClose={()=>setPreview(null)}/>}
 <button className="secondary" disabled={busy||loading||!!loadError||!shown.length} onClick={()=>{try{downloadText(certificatesCsv(shown,courses),'certificados.csv');setSuccess('Download solicitado com os resultados filtrados.')}catch{setError('Não foi possível gerar o relatório. Tente novamente.')}}}>Exportar resultados (CSV)</button>
 <div className="filters"><Field label="Buscar certificados" value={query} type="search" onChange={e=>setQuery(e.target.value)}/><label className="field">Filtrar por curso<select value={courseFilter} onChange={e=>setCourseFilter(e.target.value)}><option value="all">Todos os cursos</option><option value="none">Sem curso vinculado</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label></div>
 {loading?<Loading/>:!loadError&&(shown.length?<><p>{shown.length} certificado(s) · {shown.reduce((sum,c)=>sum+Number(c.hours),0)} horas registradas</p><ul className="study-list">{shown.map(c=><li key={c.id}><div className="record-main"><div><h2>{c.title}</h2><p>{c.institution||'Instituição não informada'} · {c.hours} h{c.issued_on?` · ${displayDate(c.issued_on)}`:''}</p>{c.course_id&&<Link to={`/courses/${c.course_id}`}>{courses.find(k=>k.id===c.course_id)?.title??'Abrir curso'}</Link>}<p>{c.file_name} · {(c.file_size/1024/1024).toFixed(1)} MB</p></div></div><div className="certificate-actions"><button className="text-button" disabled={busy} onClick={()=>{setPreview(c);setEditing(null);setDeleting(null)}}>Visualizar / baixar</button><button className="text-button" disabled={busy} aria-label={`Editar certificado ${c.title}`} onClick={()=>start(c)}>Editar</button><button className="text-button danger" disabled={busy} aria-label={`Excluir certificado ${c.title}`} onClick={()=>{setDeleting(c);setEditing(null)}}>Excluir</button></div></li>)}</ul></>:<div className="empty"><h2>{records.length?'Nenhum certificado encontrado.':'Sua próxima conquista tem lugar aqui.'}</h2><p>{records.length?'Ajuste a busca ou o filtro de cursos.':'Adicione seu primeiro certificado em PDF ou imagem.'}</p></div>)}
 </section>
}
