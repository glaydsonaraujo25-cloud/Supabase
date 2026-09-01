import { expect, it } from 'vitest'
import { elapsedSeconds, weeklyMinutes, duration, type StudySession } from './focus'
it('uses wall clock time after background throttling and excludes paused time',()=>{expect(elapsedSeconds(20,1000,61000)).toBe(80);expect(elapsedSeconds(20,null,61000)).toBe(20)})
it('bounds clock drift and caps sessions at twelve hours',()=>{expect(elapsedSeconds(0,5000,1000)).toBe(0);expect(elapsedSeconds(0,0,999999999)).toBe(43200)})
it('counts only the Monday through Sunday week across a year boundary',()=>{const rows=[{studied_on:'2024-12-29',minutes:100},{studied_on:'2024-12-30',minutes:30},{studied_on:'2025-01-05',minutes:45},{studied_on:'2025-01-06',minutes:100}] as StudySession[];expect(weeklyMinutes(rows,'2025-01-01')).toBe(75);expect(duration(75)).toBe('1 h 15 min')})
