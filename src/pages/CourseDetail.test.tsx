// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
const mock = vi.hoisted(()=>({ writes: vi.fn(), failure: false, missing: false }))
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>({session:{user:{id:'owner'}}})}))
vi.mock('../lib/supabase',()=>({client:()=>({from:(table:string)=>{
 const values: Record<string,unknown> = { study_courses: mock.missing?null:{id:'course',title:'Python',hours:10,progress:50,manual_progress:20,auto_progress:true}, course_modules:[{id:'module',title:'Básico',position:1}], course_lessons:[{id:'lesson',module_id:'module',title:'Variáveis',completed:false,position:1}], course_notes:[], tasks:[] }
 const q:any={select:()=>q,eq:()=>q,order:()=>q,maybeSingle:()=>Promise.resolve({data:values[table],error:null}),then:(resolve:any)=>Promise.resolve({data:values[table],error:null}).then(resolve),insert:(v:unknown)=>{mock.writes(table,'insert',v);return q},update:(v:unknown)=>{mock.writes(table,'update',v);return q},delete:()=>{mock.writes(table,'delete');return q},single:()=>Promise.resolve({data:{id:'saved'},error:mock.failure?{message:'failed'}:null})}
 return q
}})}))
import { CourseWorkspace } from './CourseDetail'
beforeEach(()=>{ mock.writes.mockClear();mock.failure=false;mock.missing=false })
afterEach(cleanup)
async function show() { render(<MemoryRouter><CourseWorkspace courseId="course"/></MemoryRouter>);await screen.findByText('Python') }
it('opens a course and marks an individual lesson complete',async()=>{
 await show();fireEvent.click(screen.getByLabelText('Variáveis'));await screen.findByText('Aula concluída.')
 expect(mock.writes).toHaveBeenCalledWith('course_lessons','update',{completed:true})
})
it('adds a lesson to the selected module with current ownership',async()=>{
 await show();fireEvent.click(screen.getByText('+ Adicionar aula'));fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Funções'}});fireEvent.click(screen.getByText('Salvar'));await screen.findByText('Alterações salvas.')
 expect(mock.writes).toHaveBeenCalledWith('course_lessons','insert',expect.objectContaining({module_id:'module',course_id:'course',user_id:'owner',title:'Funções'}))
})
it('preserves entered note content on a save error',async()=>{
 await show();mock.failure=true;fireEvent.click(screen.getByText('Nova anotação'));fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Resumo'}});fireEvent.change(screen.getByLabelText('Conteúdo'),{target:{value:'Minhas dúvidas'}});fireEvent.click(screen.getByText('Salvar'));await screen.findByRole('alert')
 expect((screen.getByLabelText('Conteúdo') as HTMLTextAreaElement).value).toBe('Minhas dúvidas')
})
it('saves automatic mode separately from the retained manual percentage',async()=>{
 await show();fireEvent.click(screen.getByRole('button',{name:'Preferências do curso'}));fireEvent.click(screen.getByLabelText('Calcular progresso automaticamente pelas aulas'));fireEvent.click(screen.getByText('Salvar preferências'));await screen.findByText('Preferências atualizadas.')
 expect(mock.writes).toHaveBeenCalledWith('courses','update',expect.objectContaining({auto_progress:false,progress:20}))
})
it('requires confirmation before removing a module',async()=>{
 await show();fireEvent.click(screen.getByText('Excluir módulo'));expect(mock.writes).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Confirmar exclusão'));await screen.findByText('Item excluído.');expect(mock.writes).toHaveBeenCalledWith('course_modules','delete')
})
it('does not display controls for a missing or inaccessible course',async()=>{
 mock.missing=true;render(<MemoryRouter><CourseWorkspace courseId="other"/></MemoryRouter>);await screen.findByText('Curso não encontrado.');expect(screen.queryByText('Novo módulo')).toBeNull()
})
