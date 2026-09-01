import { expect, it } from 'vitest'
import { csv, foldLine, tasksIcs, certificatesCsv } from './exports'
import type { Task } from '../types/study'
import type { Certificate } from './certificates'
const task=(overrides:Partial<Task>={})=>({id:'id-1',title:'Revisão',due_date:'2024-02-29',status:'pending',...overrides} as Task)
it('preserves accents, quotes, separators and multiline text',()=>{expect(csv([['Ação; "teste"\nlinha',4]])).toBe('\uFEFF"Ação; ""teste""\nlinha";"4"\r\n')})
it.each(['=1+1',' +SUM(A1)','-2+3','@SUM(A1)','\t=1'])('neutralizes spreadsheet formula %s',value=>{expect(csv([[value]])).toContain('"\''+value+'"')})
it('exports only pending dated tasks with exclusive next-day end',()=>{const result=tasksIcs([task(),task({id:'done',status:'done'}),task({id:'none',due_date:null})],new Date('2025-01-01T12:00:00Z'));expect(result.match(/BEGIN:VEVENT/g)).toHaveLength(1);expect(result).toContain('DTSTART;VALUE=DATE:20240229\r\nDTEND;VALUE=DATE:20240301');expect(result).toContain('DTSTAMP:20250101T120000Z')})
it('escapes injected calendar lines as text',()=>{const result=tasksIcs([task({title:'x\r\nBEGIN:VEVENT;abc,def\\ghi'})]);expect(result.match(/\r\nBEGIN:VEVENT/g)).toHaveLength(1);expect(result).toContain('SUMMARY:x\\nBEGIN:VEVENT\\;abc\\,def\\\\ghi')})
it('folds UTF-8 safely within 75 octets',()=>{const source='SUMMARY:'+ 'ç🙂'.repeat(40);const folded=foldLine(source);expect(folded.replace(/\r\n /g,'')).toBe(source);for(const line of folded.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)})
it('does not export private storage paths or user ids',()=>{const result=certificatesCsv([{title:'Curso',institution:'Escola',hours:10,issued_on:null,course_id:null,user_id:'secret-owner',file_path:'private/path'} as Certificate],[]);expect(result).not.toContain('secret-owner');expect(result).not.toContain('private/path')})
