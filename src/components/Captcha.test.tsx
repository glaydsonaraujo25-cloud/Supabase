// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
const mocks = vi.hoisted(()=>({ login: vi.fn(), recover: vi.fn(), reset: vi.fn() }))
vi.mock('@hcaptcha/react-hcaptcha', async()=>{
 const React = await import('react')
 return { default: React.forwardRef((props: {onVerify:(t:string)=>void;onExpire:()=>void;onError:()=>void},ref)=>{
  React.useImperativeHandle(ref,()=>({resetCaptcha:mocks.reset}))
  return <div><button type="button" onClick={()=>props.onVerify('single-use-token')}>Resolver CAPTCHA</button><button type="button" onClick={props.onExpire}>Expirar CAPTCHA</button><button type="button" onClick={props.onError}>Falhar CAPTCHA</button></div>
 }) }
})
vi.mock('../contexts/AuthContext',()=>({useAuth:()=>({session:null,recovery:false})}))
vi.mock('../lib/supabase',()=>({ callbackFailed:false,callbackLocationKey:'default',client:()=>({auth:{signInWithPassword:mocks.login,resetPasswordForEmail:mocks.recover}}) }))
import Login from '../pages/Login'
import ForgotPassword from '../pages/ForgotPassword'
beforeEach(()=>{vi.clearAllMocks();mocks.login.mockResolvedValue({error:{code:'invalid_credentials'}});mocks.recover.mockResolvedValue({error:null})})
afterEach(cleanup)
function login() { render(<MemoryRouter><Login/></MemoryRouter>);fireEvent.change(screen.getByLabelText('E-mail'),{target:{value:'ana@example.com'}});fireEvent.change(screen.getByLabelText('Senha'),{target:{value:'testpass123'}}) }
it('blocks submit without a solved challenge, including direct form submission',()=>{
 login(); const button=screen.getByRole('button',{name:'Entrar'}) as HTMLButtonElement
 expect(button.disabled).toBe(true);fireEvent.submit(button.closest('form')!);expect(mocks.login).not.toHaveBeenCalled()
})
it('sends the token and requires a new challenge after a failed login',async()=>{
 login();fireEvent.click(screen.getByText('Resolver CAPTCHA'));fireEvent.click(screen.getByRole('button',{name:'Entrar'}));await screen.findByText('E-mail ou senha incorretos.')
 expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining({options:{captchaToken:'single-use-token'}}))
 expect(mocks.reset).toHaveBeenCalledOnce();expect((screen.getByRole('button',{name:'Entrar'}) as HTMLButtonElement).disabled).toBe(true)
})
it('invalidates expired tokens',()=>{
 login();fireEvent.click(screen.getByText('Resolver CAPTCHA'));fireEvent.click(screen.getByText('Expirar CAPTCHA'))
 expect((screen.getByRole('button',{name:'Entrar'}) as HTMLButtonElement).disabled).toBe(true)
 expect(screen.getByText('A verificação expirou. Confirme novamente.')).toBeTruthy()
})
it('blocks submissions after a widget error and allows a fresh challenge',()=>{
 login();fireEvent.click(screen.getByText('Resolver CAPTCHA'));fireEvent.click(screen.getByText('Falhar CAPTCHA'));expect((screen.getByRole('button',{name:'Entrar'}) as HTMLButtonElement).disabled).toBe(true)
 fireEvent.click(screen.getByText('Recarregar verificação'));fireEvent.click(screen.getByText('Resolver CAPTCHA'));expect((screen.getByRole('button',{name:'Entrar'}) as HTMLButtonElement).disabled).toBe(false)
})
it('passes the solved token to password recovery and clears it afterwards',async()=>{
 render(<MemoryRouter><ForgotPassword/></MemoryRouter>);fireEvent.change(screen.getByLabelText('E-mail'),{target:{value:'ana@example.com'}});fireEvent.click(screen.getByText('Resolver CAPTCHA'));fireEvent.click(screen.getByText('Enviar link de recuperação'))
 await waitFor(()=>expect(mocks.recover).toHaveBeenCalledWith('ana@example.com',expect.objectContaining({captchaToken:'single-use-token',redirectTo:expect.stringContaining('/reset-password')})))
 expect(mocks.reset).toHaveBeenCalledOnce()
})
