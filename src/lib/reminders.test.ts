import { expect,it } from 'vitest'
import { reminderCounts } from './reminders'
import type { Task } from '../types/study'
it('counts pending deadlines across the year boundary and ignores completed or undated tasks',()=>{const tasks=[{due_date:'2024-12-30',status:'pending'},{due_date:'2024-12-31',status:'doing'},{due_date:'2025-01-01',status:'pending'},{due_date:'2024-12-30',status:'done'},{due_date:null,status:'pending'}] as Task[];expect(reminderCounts(tasks,'2024-12-31')).toEqual({overdue:1,today:1,tomorrow:1})})
