export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
export function passwordError(password: string, confirmation: string) {
  if (password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (password !== confirmation) return 'As senhas não coincidem.'
  return ''
}
export function avatarError(file: Pick<File, 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Escolha uma imagem JPG, PNG ou WebP.'
  if (!file.size || file.size > 2 * 1024 * 1024) return 'A imagem deve ter até 2 MB e não pode estar vazia.'
  return ''
}
export function isPublicKey(key: string) {
  if (key.startsWith('sb_publishable_')) return true
  try { return JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon' } catch { return false }
}
