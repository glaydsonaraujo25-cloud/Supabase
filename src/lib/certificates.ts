import { client } from './supabase'
import { decodeImage } from './profile'
export interface Certificate {
 id: string; user_id: string; course_id: string | null; title: string; institution: string; hours: number; issued_on: string | null;
 file_path: string; file_name: string; mime_type: string; file_size: number; created_at: string
}
export type CertificateFields = Pick<Certificate,'course_id'|'title'|'institution'|'hours'|'issued_on'>
const extensions: Record<string,string> = { 'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp' }
export function certificateFileError(file: Pick<File,'size'|'type'>) {
 if (!extensions[file.type]) return 'Escolha um PDF ou uma imagem JPG, PNG ou WebP.'
 if (!file.size || file.size > 10*1024*1024) return 'O arquivo deve ter até 10 MB e não pode estar vazio.'
 return ''
}
export async function uploadCertificate(owner: string, fields: CertificateFields, file: File) {
 const invalid = certificateFileError(file); if(invalid) throw new Error(invalid)
 if(file.type==='application/pdf') {
  const bytes = await file.slice(0,5).text(); if(bytes!=='%PDF-') throw new Error('O arquivo não parece ser um PDF válido.')
 } else await decodeImage(file)
 const file_path = `${owner}/${crypto.randomUUID()}.${extensions[file.type]}`
 const {error:uploadError} = await client().storage.from('certificates').upload(file_path,file,{contentType:file.type,upsert:false})
 if(uploadError) throw uploadError
 const {data,error} = await client().from('certificates').insert({...fields,user_id:owner,file_path,file_name:file.name.slice(0,255),mime_type:file.type,file_size:file.size}).select().single()
 // Keep the upload on an ambiguous failure: the database may have committed.
 if(error) throw error
 return data as Certificate
}
export async function deleteCertificate(certificate: Certificate, owner: string) {
 const {error} = await client().from('certificates').delete().eq('id',certificate.id).eq('user_id',owner).select('id').single()
 if(error) throw error
 try { const result=await client().storage.from('certificates').remove([certificate.file_path]); return !result.error }
 catch { return false }
}
