// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), remove: vi.fn(), single: vi.fn(), reload: vi.fn() }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ session: { user: { id: 'owner' } } }) }))
vi.mock('../hooks/useStudy', () => ({ useStudy: () => ({ courses: [{ id: 'course', title: 'Python', institution: 'Escola', hours: 10, progress: 50, url: null }], tasks: [{ id: 'task', title: 'Exercício', course_id: 'course', status: 'pending', priority: 'medium', due_date: '2026-01-01' }], loading: false, error: '', reload: mocks.reload }) }))
vi.mock('../lib/supabase', () => ({ client: () => ({ from: () => {
  const query = { eq: () => query, select: () => query, single: mocks.single }
  return { insert: (v: unknown) => { mocks.insert(v); return query }, update: (v: unknown) => { mocks.update(v); return query }, delete: () => { mocks.remove(); return query } }
} }) }))
import Study from './Study'
beforeEach(() => { vi.clearAllMocks(); mocks.single.mockResolvedValue({ data: { id: 'saved' }, error: null }) })
afterEach(cleanup)
function show(mode: 'courses' | 'tasks') { render(<MemoryRouter><Study mode={mode}/></MemoryRouter>) }
it('creates a course with the current owner and normalized fields', async () => {
  show('courses'); fireEvent.click(screen.getByText('Novo curso'))
  fireEvent.change(screen.getByLabelText('Nome do curso'), { target: { value: '  React  ' } })
  fireEvent.click(screen.getByText('Salvar curso'))
  await screen.findByText('Curso salvo com sucesso.')
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'owner', title: 'React', progress: 0, url: null }))
})
it('edits a course without overwriting its owner', async () => {
  show('courses'); fireEvent.click(screen.getByLabelText('Editar Python'))
  fireEvent.change(screen.getByLabelText('Progresso manual (%)'), { target: { value: '100' } })
  fireEvent.click(screen.getByText('Salvar curso'))
  await screen.findByText('Curso salvo com sucesso.')
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ progress: 100 }))
  expect(mocks.update.mock.calls[0][0]).not.toHaveProperty('user_id')
})
it('requires explicit confirmation before deleting a course and its tasks', async () => {
  show('courses'); fireEvent.click(screen.getByLabelText('Excluir Python'))
  expect(mocks.remove).not.toHaveBeenCalled()
  expect(screen.getByText(/As tarefas, módulos/)).toBeTruthy()
  fireEvent.click(screen.getByText('Confirmar exclusão'))
  await screen.findByText('Curso e tarefas vinculadas excluídos.')
  expect(mocks.remove).toHaveBeenCalledOnce()
})
it('completes a task and refreshes persisted data', async () => {
  show('tasks'); fireEvent.click(screen.getByRole('checkbox'))
  await screen.findByText('Tarefa concluída.')
  expect(mocks.update).toHaveBeenCalledWith({ status: 'done' })
  expect(mocks.reload).toHaveBeenCalledOnce()
})
it('keeps the form and shows an error when saving fails', async () => {
  mocks.single.mockResolvedValue({ error: { code: 'unexpected' } })
  show('tasks'); fireEvent.click(screen.getByText('Nova tarefa'))
  fireEvent.change(screen.getByLabelText('Título da tarefa'), { target: { value: 'Estudar' } })
  fireEvent.click(screen.getByText('Salvar tarefa'))
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Não foi possível'))
  expect(screen.getByLabelText('Título da tarefa')).toBeTruthy()
  expect(mocks.reload).not.toHaveBeenCalled()
})
it('filters records and explains empty search results', () => {
  show('courses'); fireEvent.change(screen.getByLabelText('Buscar por nome'), { target: { value: 'Java' } })
  expect(screen.queryByText('Python')).toBeNull()
  expect(screen.getByText('Nenhum resultado encontrado.')).toBeTruthy()
})
