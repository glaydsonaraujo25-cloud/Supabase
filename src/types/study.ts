export interface Course { id: string; user_id: string; title: string; institution: string; hours: number; url: string | null; progress: number; created_at: string }
export interface Task { id: string; user_id: string; course_id: string | null; title: string; due_date: string | null; priority: 'low' | 'medium' | 'high'; status: 'pending' | 'doing' | 'done'; created_at: string }
export const taskStatuses = { pending: 'Pendente', doing: 'Em andamento', done: 'Concluída' }
export const priorities = { low: 'Baixa', medium: 'Média', high: 'Alta' }
export const courseStatus = (progress: number) => progress === 100 ? 'Concluído' : progress === 0 ? 'Não iniciado' : 'Em andamento'
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function isOverdue(task: Task, today = localDate()) { return task.status !== 'done' && !!task.due_date && task.due_date < today }
export function displayDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') }
export function safeCourseUrl(value: string) { if (!value.trim()) return null; let url: URL; try { url = new URL(value.trim()) } catch { throw new Error('invalid_url') } if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid_url'); return url.href }
