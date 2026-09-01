import { describe, expect, it } from 'vitest'
import { avatarError, isPublicKey, passwordError, validEmail } from './validation'
import { friendlyError } from './errors'
describe('client validation boundaries', () => {
  it('accepts normal emails and rejects whitespace/missing domains', () => {
    expect(validEmail('ana@example.com')).toBe(true)
    for (const value of ['', 'ana', 'ana@', 'ana @example.com']) expect(validEmail(value)).toBe(false)
  })
  it('requires eight characters and matching confirmation', () => {
    expect(passwordError('1234567', '1234567')).toBeTruthy()
    expect(passwordError('12345678', '12345679')).toBeTruthy()
    expect(passwordError('12345678', '12345678')).toBe('')
  })
  it('rejects SVG, empty and oversized uploads', () => {
    expect(avatarError({ type: 'image/svg+xml', size: 100 })).toBeTruthy()
    expect(avatarError({ type: 'image/png', size: 0 })).toBeTruthy()
    expect(avatarError({ type: 'image/png', size: 2097153 })).toBeTruthy()
    expect(avatarError({ type: 'image/webp', size: 2097152 })).toBe('')
  })
  it('rejects secret and service-role keys', () => {
    expect(isPublicKey('sb_secret_example')).toBe(false)
    expect(isPublicKey(`a.${btoa(JSON.stringify({ role: 'service_role' }))}.c`)).toBe(false)
    expect(isPublicKey(`a.${btoa(JSON.stringify({ role: 'anon' }))}.c`)).toBe(true)
    expect(isPublicKey('sb_publishable_example')).toBe(true)
  })
  it('does not expose backend internals', () => {
    expect(friendlyError({ message: 'secret database detail' })).not.toContain('database')
    expect(friendlyError({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.')
  })
})

import { validSupabaseUrl } from './validation'
it('rejects malformed URLs before initializing the SDK', () => {
  for (const value of ['https://', 'https://[invalid', 'javascript:alert(1)', 'https://user:pass@example.com']) expect(validSupabaseUrl(value)).toBe(false)
  expect(validSupabaseUrl('https://project.supabase.co')).toBe(true)
})

it('distinguishes email quota from request throttling', () => {
  const message = friendlyError({ code: 'over_email_send_rate_limit', status: 429 })
  expect(message).toContain('limite de envio de e-mails')
  expect(message).not.toContain('alguns minutos')
  expect(friendlyError({ code: 'over_request_rate_limit', status: 429 })).toContain('Muitas tentativas')
})
