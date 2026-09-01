// @vitest-environment jsdom
import { cleanup,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
const mock=vi.hoisted(()=>({rpc:vi.fn(),remove:vi.fn()}))
vi.mock('../lib/supabase',()=>({client:()=>({rpc:mock.rpc,storage:{from:()=>({remove:mock.remove})}})}))
import { StorageCleanup } from './StorageCleanup'
beforeEach(()=>{vi.clearAllMocks();mock.rpc.mockResolvedValueOnce({data:[{bucket_id:'avatars',path:'owner/file.png',created_at:'2025-01-01'}]});mock.remove.mockResolvedValue({data:[{name:'owner/file.png'}],error:null})})
afterEach(cleanup)
it('requires selection and confirmation then claims before deleting',async()=>{mock.rpc.mockResolvedValueOnce({data:true});render(<StorageCleanup/>);fireEvent.click(screen.getByText('Verificar arquivos'));fireEvent.click(await screen.findByRole('checkbox'));fireEvent.click(screen.getByText('Remover selecionados (1)'));expect(mock.remove).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Confirmar exclusão dos arquivos'));await screen.findByText('1 arquivo(s) removido(s).');expect(mock.rpc).toHaveBeenLastCalledWith('claim_unused_file',{p_bucket:'avatars',p_path:'owner/file.png'});expect(mock.remove).toHaveBeenCalledWith(['owner/file.png'])})
it('does not delete a file whose claim fails after the scan',async()=>{mock.rpc.mockResolvedValueOnce({data:false});render(<StorageCleanup/>);fireEvent.click(screen.getByText('Verificar arquivos'));fireEvent.click(await screen.findByRole('checkbox'));fireEvent.click(screen.getByText('Remover selecionados (1)'));fireEvent.click(screen.getByText('Confirmar exclusão dos arquivos'));await screen.findByText(/não foram removidos/);expect(mock.remove).not.toHaveBeenCalled()})
