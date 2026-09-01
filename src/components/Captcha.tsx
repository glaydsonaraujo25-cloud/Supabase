import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useCallback, useRef, useState } from 'react'
import { Notice } from './UI'
// Public site identifier supplied by the project owner. Never put a secret here.
export const captchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY?.trim() || '3ea62bb2-8b60-4c24-a4fc-995eb680023a'
export function useCaptcha() {
  const ref = useRef<HCaptcha>(null)
  const [token, setToken] = useState('')
  const reset = useCallback(() => { setToken(''); ref.current?.resetCaptcha() }, [])
  return { ref, token, setToken, reset }
}
export function Captcha({ state }: { state: ReturnType<typeof useCaptcha> }) {
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  return <div className="captcha"><p className="hint">Confirme que você é uma pessoa para continuar.</p><HCaptcha key={attempt} ref={state.ref} sitekey={captchaSiteKey} languageOverride="pt" size="compact" theme="light"
    onVerify={token => { setError(''); state.setToken(token) }}
    onExpire={() => { state.setToken(''); setError('A verificação expirou. Confirme novamente.') }}
    onChalExpired={() => { state.setToken(''); setError('O desafio expirou. Tente novamente.') }}
    onError={() => { state.setToken(''); setError('Não foi possível carregar a verificação. Verifique sua conexão ou bloqueador de conteúdo e tente novamente.') }}/>
    <Notice error>{error}</Notice>{error && <button type="button" className="text-button" onClick={() => { state.setToken(''); setError(''); setAttempt(n => n + 1) }}>Recarregar verificação</button>}
  </div>
}
