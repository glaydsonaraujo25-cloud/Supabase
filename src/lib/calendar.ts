import { localDate, type Task } from '../types/study'
export function monthDays(year: number, month: number) {
 const first=new Date(year,month,1,12);const start=new Date(year,month,1-((first.getDay()+6)%7),12)
 return Array.from({length:42},(_,i)=>{const day=new Date(start);day.setDate(start.getDate()+i);return {date:localDate(day),day:day.getDate(),inMonth:day.getMonth()===month}})
}
export function weekRange(today: string) {
 const start=new Date(`${today}T12:00:00`);start.setDate(start.getDate()-((start.getDay()+6)%7));const end=new Date(start);end.setDate(start.getDate()+6)
 return {start:localDate(start),end:localDate(end)}
}
export function calendarTasks(tasks: Task[], view: string, selected: string, today: string) {
 const week=weekRange(today)
 return tasks.filter(t=>view==='overdue'?t.status!=='done'&&!!t.due_date&&t.due_date<today:view==='week'?!!t.due_date&&t.due_date>=week.start&&t.due_date<=week.end:view==='undated'?!t.due_date:t.due_date===(view==='today'?today:selected)).sort((a,b)=>(a.due_date??'').localeCompare(b.due_date??'')||({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]))
}
