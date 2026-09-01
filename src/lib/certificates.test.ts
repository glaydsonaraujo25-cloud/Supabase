import { beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({upload:vi.fn(),remove:vi.fn(),single:vi.fn()}))
vi.mock('./supabase',()=>({client:()=>({storage:{from:()=>mocks},from:()=>{const chain={insert:()=>chain,delete:()=>chain,eq:()=>chain,select:()=>chain,single:mocks.single};return chain}})}))
import { certificateFileError, uploadCertificate, deleteCertificate, type Certificate } from './certificates'
const fields={title:'Curso',institution:'',hours:1,issued_on:null,course_id:null}
const pdf=(signature='%PDF-')=>({type:'application/pdf',size:30,name:'curso.pdf',slice:()=>({text:async()=>signature})}) as unknown as File
beforeEach(()=>{vi.resetAllMocks();mocks.upload.mockResolvedValue({error:null});mocks.single.mockResolvedValue({data:{id:'cert'},error:null});mocks.remove.mockResolvedValue({error:null})})
it('rejects executable, empty and oversized uploads',()=>{expect(certificateFileError({type:'text/html',size:5})).toBeTruthy();expect(certificateFileError({type:'application/pdf',size:0})).toBeTruthy();expect(certificateFileError({type:'image/png',size:10485761})).toBeTruthy()})
it('rejects a fake PDF before uploading',async()=>{await expect(uploadCertificate('owner',fields,pdf('<html'))).rejects.toThrow();expect(mocks.upload).not.toHaveBeenCalled()})
it('preserves files if the insert response is ambiguous',async()=>{mocks.single.mockResolvedValue({error:new Error('network')});await expect(uploadCertificate('owner',fields,pdf())).rejects.toThrow();expect(mocks.upload).toHaveBeenCalledOnce();expect(mocks.remove).not.toHaveBeenCalled()})
it('does not remove files when metadata deletion fails',async()=>{mocks.single.mockResolvedValue({error:new Error('denied')});await expect(deleteCertificate({id:'cert',file_path:'owner/file.pdf'} as Certificate,'owner')).rejects.toThrow();expect(mocks.remove).not.toHaveBeenCalled()})
it('reports storage cleanup failures after successful deletion',async()=>{mocks.remove.mockRejectedValue(new Error('network'));expect(await deleteCertificate({id:'cert',file_path:'owner/file.pdf'} as Certificate,'owner')).toBe(false)})
