import { client } from './supabase'
import type { Profile } from '../types/profile'

export async function saveProfile(id: string, fullName: string, oldPath: string | null, file: File | null) {
  let newPath: string | null = null
  if (file) {
    await decodeImage(file)
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    if (!ext) throw new Error('invalid_image')
    newPath = `${id}/${crypto.randomUUID()}.${ext}`
    const { error } = await client().storage.from('avatars').upload(newPath, file, { contentType: file.type, upsert: false })
    if (error) throw error
  }
  const { data, error } = await client().from('profiles').update({ full_name: fullName, avatar_url: newPath ?? oldPath }).eq('id', id).select().single()
  // A lost response can occur AFTER the server commits. Never delete the new
  // image on an ambiguous failure; doing so could break the persisted profile.
  if (error) throw error
  let cleanupFailed = false
  if (newPath && oldPath?.startsWith(`${id}/`)) {
    try {
      const result = await client().storage.from('avatars').remove([oldPath])
      cleanupFailed = !!result.error
    } catch { cleanupFailed = true }
  }
  return { profile: data as Profile, cleanupFailed }
}

export async function decodeImage(file: File) {
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
      return
    }
    // Older browsers can decode ordinary images without createImageBitmap.
    const url = URL.createObjectURL(file)
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image()
        image.onload = () => image.naturalWidth > 0 ? resolve() : reject()
        image.onerror = reject
        image.src = url
      })
    } finally { URL.revokeObjectURL(url) }
  } catch { throw new Error('invalid_image') }
}
