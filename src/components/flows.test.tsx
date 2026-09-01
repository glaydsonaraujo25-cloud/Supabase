// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
const mocks = vi.hoisted(() => ({ signInWithPassword: vi.fn(), auth: { session: null, recovery: false, loading: false, finishRecovery: vi.fn() } }))
vi.mock('../lib/supabase', () => ({ configured: true, callbackFailed: true, callbackLocationKey: 'default', client: () => ({ auth: { signInWithPassword: mocks.signInWithPassword } }) }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => mocks.auth }))
import { Avatar } from './UI'
import Login from '../pages/Login'
import App from '../App'
afterEach(() => { cleanup(); vi.clearAllMocks() })
it('shows a placeholder after an image fails, then displays a replacement photo', () => {
  const { rerender, container } = render(<Avatar src="/broken.png" name="Ana"/>)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.queryByRole('img')).toBeNull()
  expect(container.querySelector('svg')).not.toBeNull()
  rerender(<Avatar src="/new.png" name="Ana"/>)
  expect(screen.getByRole('img').getAttribute('src')).toBe('/new.png')
})
it('shows login errors after arriving through an expired link', async () => {
  mocks.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
  render(<MemoryRouter><Login/></MemoryRouter>)
  expect(screen.getByRole('alert').textContent).toContain('link')
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'wrongpass' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('E-mail ou senha incorretos.')).toBeTruthy()
})
it.each(['/dashboard', '/profile'])('protects %s when there is no session', async path => {
  vi.stubGlobal('scrollTo', vi.fn())
  render(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>)
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy()
  expect(screen.queryByText('Salvar alterações')).toBeNull()
})
