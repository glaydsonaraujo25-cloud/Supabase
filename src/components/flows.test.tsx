// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
const mocks = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signUp: vi.fn(), auth: { session: null, recovery: false, loading: false, finishRecovery: vi.fn() } }))
vi.mock('../lib/supabase', () => ({ configured: true, callbackFailed: true, callbackLocationKey: 'default', client: () => ({ auth: { signInWithPassword: mocks.signInWithPassword, signUp: mocks.signUp } }) }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => mocks.auth }))
import { Avatar } from './UI'
import Login from '../pages/Login'
import App from '../App'
import Register from '../pages/Register'
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
it.each(['/dashboard', '/profile', '/courses', '/tasks'])('protects %s when there is no session', async path => {
  vi.stubGlobal('scrollTo', vi.fn())
  render(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>)
  expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy()
  expect(screen.queryByText('Salvar alterações')).toBeNull()
})

function fillRegistration() {
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Silva' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'testpass123' } })
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'testpass123' } })
}
it.each([
  { data: { user: { identities: [] }, session: null }, error: null },
  { data: { user: null, session: null }, error: { code: 'user_already_exists' } },
  { data: { user: null, session: null }, error: { code: 'email_exists' } },
])('blocks existing email without showing confirmation success', async response => {
  mocks.signUp.mockResolvedValue(response)
  render(<MemoryRouter><Register/></MemoryRouter>)
  fillRegistration()
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  expect(await screen.findByText('Este e-mail já está cadastrado.')).toBeTruthy()
  const button = screen.getByRole('button', { name: 'Criar conta' }) as HTMLButtonElement
  expect(button.disabled).toBe(true)
  fireEvent.submit(button.closest('form')!)
  expect(mocks.signUp).toHaveBeenCalledOnce()
  expect(screen.queryByText(/Confira seu e-mail/)).toBeNull()
  expect(screen.getByRole('link', { name: 'Recuperar senha' }).getAttribute('href')).toBe('/forgot-password')
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: ' ANA@example.com ' } })
  expect(button.disabled).toBe(true)
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'outra@example.com' } })
  expect(button.disabled).toBe(false)
})
it('still advances valid new registrations to confirmation instructions', async () => {
  mocks.signUp.mockResolvedValue({ data: { user: { identities: [{ id: 'new' }] }, session: null }, error: null })
  render(<MemoryRouter><Register/></MemoryRouter>)
  fillRegistration()
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
  expect(await screen.findByText(/Confira seu e-mail/)).toBeTruthy()
  expect(screen.queryByText('Este e-mail já está cadastrado.')).toBeNull()
})
