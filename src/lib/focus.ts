import { weekRange } from './calendar'
export interface StudySession { id:string;user_id:string;course_id:string|null;studied_on:string;minutes:number;note:string;created_at:string }
export function weeklyMinutes(sessions:StudySession[],today:string) {
 const {start,end}=weekRange(today)
 return sessions.filter(s=>s.studied_on>=start&&s.studied_on<=end).reduce((sum,s)=>sum+s.minutes,0)
}
export function elapsedSeconds(accumulated:number,started:number|null,now:number) {
 return Math.min(43200,Math.max(0,Math.floor(accumulated+(started===null?0:(now-started)/1000))))
}
export function duration(minutes:number) {return `${Math.floor(minutes/60)} h ${minutes%60} min`}
