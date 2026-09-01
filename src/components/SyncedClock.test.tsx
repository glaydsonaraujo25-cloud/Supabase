// @vitest-environment jsdom
import { cleanup,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
const mock=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('../lib/supabase',()=>({client:()=>({rpc:mock.rpc})}))
import { SyncedClock } from './SyncedClock'
const clock={accumulated:120,started_at:null,version:3,run_id:'run',server_now:new Date().toISOString()}
beforeEach(()=>{mock.rpc.mockReset();mock.rpc.mockResolvedValue({data:clock,error:null})})
afterEach(cleanup)
it('saves paused time with the observed version and run id',async()=>{const onSaved=vi.fn();render(<SyncedClock courses={[]} onSaved={onSaved}/>);fireEvent.click(await screen.findByText('Salvar tempo cronometrado'));await screen.findByText('Sessão salva e cronômetro reiniciado.');expect(mock.rpc).toHaveBeenLastCalledWith('study_clock_command',expect.objectContaining({p_action:'finish',p_version:3,p_run_id:'run'}));expect(onSaved).toHaveBeenCalledOnce()})
it('surfaces a cross-device conflict without silently overwriting',async()=>{render(<SyncedClock courses={[]} onSaved={vi.fn()}/>);await screen.findByText('Salvar tempo cronometrado');mock.rpc.mockResolvedValueOnce({error:{message:'clock_conflict'}});fireEvent.click(screen.getByText('Iniciar / continuar'));await screen.findByText('O cronômetro foi alterado em outro dispositivo. Atualize antes de continuar.');expect((screen.getByText('Iniciar / continuar') as HTMLButtonElement).disabled).toBe(true)})
