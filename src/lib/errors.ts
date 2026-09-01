export function friendlyError(error: unknown): string {
  const e = error as { code?: string; message?: string; status?: number }
  switch (e?.code) {
    case 'invalid_credentials': return 'E-mail ou senha incorretos.'
    case 'email_not_confirmed': return 'Confirme seu e-mail antes de entrar. Verifique também a pasta de spam.'
    case 'user_already_exists': case 'email_exists': return 'Não foi possível criar a conta. Tente entrar ou recuperar sua senha.'
    case 'weak_password': return 'Escolha uma senha mais forte, com pelo menos 8 caracteres.'
    case 'same_password': return 'Escolha uma senha diferente da atual.'
    case 'over_email_send_rate_limit': case 'over_request_rate_limit': return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    case 'otp_expired': return 'Este link expirou. Solicite um novo link.'
    case 'session_not_found': case 'refresh_token_not_found': return 'Sua sessão expirou. Entre novamente.'
  }
  if (e?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (e?.message === 'Failed to fetch' || error instanceof TypeError) return 'Não foi possível conectar. Verifique sua internet e tente novamente.'
  return 'Não foi possível concluir. Tente novamente em alguns instantes.'
}
