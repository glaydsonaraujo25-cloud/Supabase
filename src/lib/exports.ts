import { localDate, priorities, taskStatuses, type Course, type Task } from '../types/study'
import type { Certificate } from './certificates'
// Quote every cell and neutralize spreadsheet formulas, including leading whitespace.
export function csv(rows: (string | number | null)[][]) {
 return '\uFEFF' + rows.map(row => row.map(value => {
  let text = String(value ?? '')
  if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
 }).join(';')).join('\r\n') + '\r\n'
}
export const coursesCsv = (courses: Course[]) => csv([['Curso','Instituição','Horas','Progresso (%)'], ...courses.map(c => [c.title,c.institution,c.hours,c.progress])])
export const certificatesCsv = (items: Certificate[], courses: Course[]) => csv([['Certificado','Instituição','Horas','Emissão','Curso'], ...items.map(c => [c.title,c.institution,c.hours,c.issued_on,courses.find(k => k.id === c.course_id)?.title ?? ''])])
export const tasksCsv = (tasks: Task[], courses: Course[]) => csv([['Tarefa','Prazo','Status','Prioridade','Curso'], ...tasks.map(t => [t.title,t.due_date,taskStatuses[t.status],priorities[t.priority],courses.find(c => c.id === t.course_id)?.title ?? ''])])
const escapeText = (text: string) => text.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,')
// RFC 5545: fold at 75 UTF-8 octets, never in the middle of a character.
export function foldLine(line: string) {
 let result = ''; let length = 0
 for (const char of line) {
  const bytes = new TextEncoder().encode(char).length
  if (length + bytes > 75) { result += '\r\n '; length = 1 }
  result += char; length += bytes
 }
 return result
}
export function tasksIcs(tasks: Task[], now = new Date()) {
 const stamp = now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')
 const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Meus Estudos//Prazos//PT-BR','CALSCALE:GREGORIAN']
 for (const task of tasks.filter(t => t.due_date && t.status !== 'done')) {
  const end = new Date(`${task.due_date}T12:00:00`); end.setDate(end.getDate()+1)
  lines.push('BEGIN:VEVENT',`UID:${escapeText(task.id)}@meus-estudos`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${task.due_date!.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${localDate(end).replace(/-/g,'')}`,`SUMMARY:${escapeText(task.title)}`,'TRANSP:TRANSPARENT','END:VEVENT')
 }
 lines.push('END:VCALENDAR')
 return lines.map(foldLine).join('\r\n') + '\r\n'
}
export function downloadText(text: string, name: string, type = 'text/csv;charset=utf-8') {
 const url = URL.createObjectURL(new Blob([text],{type}))
 const link = document.createElement('a'); link.href = url; link.download = name
 document.body.appendChild(link)
 try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000) }
}
