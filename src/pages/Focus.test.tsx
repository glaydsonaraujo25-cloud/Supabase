// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({single:vi.fn(),insert:vi.fn(),upsert:vi.fn(),update:vi.fn(),rows:[] as unknown[]}))
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>({session:{user:{id:'owner'}}})}))
vi.mock('../hooks/useStudy',()=>({useStudy:()=>({courses:[],tasks:[],loading:false,error:'',reload:vi.fn()})}))
vi.mock('../lib/loadOwned',()=>({loadOwned:async()=>mocks.rows}))
vi.mock('../lib/supabase',()=>({client:()=>({from:()=>{const q={update:(v:unknown)=>{mocks.update(v);return q},select:()=>q,eq:()=>q,abortSignal:()=>q,maybeSingle:async()=>({data:null,error:null}),insert:(v:unknown)=>{mocks.insert(v);return q},upsert:(v:unknown)=>{mocks.upsert(v);return q},single:mocks.single};return q}})}))
import Focus from './Focus'
beforeEach(()=>{vi.clearAllMocks();mocks.rows=[];sessionStorage.clear();mocks.single.mockResolvedValue({data:{id:'ok'},error:null})})
afterEach(cleanup)
it('saves a manual session for the authenticated owner',async()=>{render(<Focus/>);await screen.findByText('Salvar sessão');fireEvent.change(screen.getByLabelText('Tempo (minutos completos)'),{target:{value:'40'}});fireEvent.click(screen.getByText('Salvar sessão'));await screen.findByText('Sessão registrada.');expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({user_id:'owner',minutes:40,course_id:null}))})
it('preserves the request id for a retry after a lost response',async()=>{mocks.single.mockResolvedValueOnce({error:{message:'offline'}});render(<Focus/>);fireEvent.click(await screen.findByText('Salvar sessão'));await waitFor(()=>expect(screen.getByText('Salvar sessão').closest('button')?.disabled).toBe(false));fireEvent.click(screen.getByText('Salvar sessão'));await screen.findByText('Sessão registrada.');expect(mocks.insert.mock.calls[0][0].id).toBe(mocks.insert.mock.calls[1][0].id)})
it('saves a weekly goal in minutes',async()=>{render(<Focus/>);await screen.findByText('Salvar meta');fireEvent.change(screen.getByLabelText('Meta semanal (horas)'),{target:{value:'3.5'}});fireEvent.click(screen.getByText('Salvar meta'));await screen.findByText('Meta semanal salva.');expect(mocks.upsert).toHaveBeenCalledWith({user_id:'owner',weekly_minutes:210})})

it('edits a saved session without inserting a duplicate',async()=>{mocks.rows=[{id:'session-1',user_id:'owner',course_id:null,studied_on:'2025-01-01',minutes:20,note:'Original',created_at:'2025-01-01'}];render(<Focus/>);fireEvent.click(await screen.findByText('Editar'));expect((screen.getByLabelText('Tempo (minutos completos)') as HTMLInputElement).value).toBe('20');fireEvent.change(screen.getByLabelText('Tempo (minutos completos)'),{target:{value:'35'}});fireEvent.click(screen.getByText('Salvar sessão'));await screen.findByText('Sessão atualizada.');expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({minutes:35,note:'Original'}));expect(mocks.insert).not.toHaveBeenCalled()})
