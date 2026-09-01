import { expect, it } from 'vitest'
import { isOverdue, courseStatus, safeCourseUrl, type Task } from './study'
it('does not mark completed or undated tasks overdue', () => {
  expect(isOverdue({ status: 'done', due_date: '2020-01-01' } as Task, '2026-09-01')).toBe(false)
  expect(isOverdue({ status: 'pending', due_date: null } as Task, '2026-09-01')).toBe(false)
  expect(isOverdue({ status: 'pending', due_date: '2026-09-01' } as Task, '2026-09-01')).toBe(false)
  expect(isOverdue({ status: 'pending', due_date: '2026-08-31' } as Task, '2026-09-01')).toBe(true)
})
it('derives status consistently from progress', () => {
  expect(courseStatus(0)).toBe('Não iniciado'); expect(courseStatus(50)).toBe('Em andamento'); expect(courseStatus(100)).toBe('Concluído')
})
it('only allows web course links', () => {
  expect(safeCourseUrl('')).toBeNull()
  expect(safeCourseUrl('https://example.com')).toBe('https://example.com/')
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@example.com', 'bad']) expect(() => safeCourseUrl(value)).toThrow('invalid_url')
})
