import { expect, it } from 'vitest'
import { calendarTasks, monthDays, weekRange } from './calendar'
import type { Task } from '../types/study'
const task=(id:string,date:string|null,status:Task['status']='pending',priority:Task['priority']='medium')=>({id,due_date:date,status,priority} as Task)
it('includes leap day and six complete Monday-first weeks',()=>{const days=monthDays(2024,1);expect(days).toHaveLength(42);expect(days[0].date).toBe('2024-01-29');expect(days.find(d=>d.date==='2024-02-29')?.inMonth).toBe(true)})
it('handles a week spanning the year boundary',()=>{expect(weekRange('2025-01-01')).toEqual({start:'2024-12-30',end:'2025-01-05'})})
it('excludes completed and today tasks from overdue results',()=>{expect(calendarTasks([task('late','2025-01-01'),task('done','2025-01-01','done'),task('today','2025-01-02'),task('none',null)],'overdue','2025-01-02','2025-01-02').map(t=>t.id)).toEqual(['late'])})
it('orders a selected day by priority without changing the original list',()=>{const list=[task('low','2025-01-02','pending','low'),task('high','2025-01-02','pending','high')];expect(calendarTasks(list,'day','2025-01-02','2025-01-03').map(t=>t.id)).toEqual(['high','low']);expect(list[0].id).toBe('low')})
it('keeps undated tasks in their own view',()=>{expect(calendarTasks([task('none',null),task('dated','2025-01-02')],'undated','2025-01-02','2025-01-02').map(t=>t.id)).toEqual(['none'])})
