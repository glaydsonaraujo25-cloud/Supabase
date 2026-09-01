// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn(), single: vi.fn() }))
vi.mock('./supabase', () => ({ client: () => ({ storage: { from: () => mocks }, from: () => ({ update: () => ({ eq: () => ({ select: () => ({ single: mocks.single }) }) }) }) }) }))
import { decodeImage, saveProfile } from './profile'
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ close: vi.fn() }))
  mocks.upload.mockResolvedValue({ error: null })
  mocks.remove.mockResolvedValue({ error: null })
  mocks.single.mockResolvedValue({ data: { id: 'user', full_name: 'Ana', avatar_url: 'user/new.png' }, error: null })
})
afterEach(() => vi.unstubAllGlobals())
const photo = () => new File(['test'], 'photo.png', { type: 'image/png' })
it('preserves uploaded avatar after an ambiguous database response', async () => {
  mocks.single.mockResolvedValue({ data: null, error: new TypeError('Failed to fetch') })
  await expect(saveProfile('user', 'Ana', 'user/old.png', photo())).rejects.toThrow()
  expect(mocks.upload).toHaveBeenCalledOnce()
  expect(mocks.remove).not.toHaveBeenCalled()
})
it('only removes the old avatar after a successful save', async () => {
  const result = await saveProfile('user', 'Ana', 'user/old.png', photo())
  expect(result.profile.full_name).toBe('Ana')
  expect(mocks.remove).toHaveBeenCalledWith(['user/old.png'])
  expect(mocks.single.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0])
})
it('keeps the successful profile result if cleanup loses connection', async () => {
  mocks.remove.mockRejectedValue(new TypeError('Failed to fetch'))
  const result = await saveProfile('user', 'Ana', 'user/old.png', photo())
  expect(result.profile.full_name).toBe('Ana')
  expect(result.cleanupFailed).toBe(true)
})
it('updates names without requiring image APIs or touching Storage', async () => {
  await saveProfile('user', 'Ana', 'user/old.png', null)
  expect(mocks.upload).not.toHaveBeenCalled()
  expect(mocks.remove).not.toHaveBeenCalled()
})
it('rejects undecodable images before uploading', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')))
  await expect(saveProfile('user', 'Ana', null, photo())).rejects.toThrow('invalid_image')
  expect(mocks.upload).not.toHaveBeenCalled()
})
it('supports image decoding when createImageBitmap is unavailable', async () => {
  vi.stubGlobal('createImageBitmap', undefined)
  const revoke = vi.fn()
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:preview', revokeObjectURL: revoke })
  vi.stubGlobal('Image', class { naturalWidth = 20; onload?: () => void; set src(_: string) { this.onload?.() } })
  await decodeImage(photo())
  expect(revoke).toHaveBeenCalledWith('blob:preview')
})
