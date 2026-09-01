import { localDate, type Task } from '../types/study'
export function reminderCounts(tasks:Task[],today=localDate()) {
 const next=new Date(`${today}T12:00:00`);next.setDate(next.getDate()+1);const tomorrow=localDate(next)
 const pending=tasks.filter(t=>t.status!=='done'&&t.due_date)
 return {overdue:pending.filter(t=>t.due_date!<today).length,today:pending.filter(t=>t.due_date===today).length,tomorrow:pending.filter(t=>t.due_date===tomorrow).length}
}
