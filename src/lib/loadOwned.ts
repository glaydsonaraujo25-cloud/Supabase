import { client } from './supabase'
/** Keyset pagination keeps reading even when the server caps a batch below 500 rows. */
export async function loadOwned<T extends { id: string }>(table: 'study_courses' | 'tasks' | 'certificates', owner: string, signal?: AbortSignal): Promise<T[]> {
 const rows: T[] = []
 let lastId: string | undefined
 while (true) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  let query = client().from(table).select('*').eq('user_id', owner).order('id').limit(500)
  if (lastId) query = query.gt('id', lastId)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query
  if (error) throw error
  if (!data) throw new Error('Missing data')
  if (!data.length) return rows
  const next = data[data.length - 1].id as string
  if (lastId && next <= lastId) throw new Error('Invalid pagination cursor')
  rows.push(...data as T[]); lastId = next
 }
}
