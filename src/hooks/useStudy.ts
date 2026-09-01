import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { client } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import type { Course, Task } from '../types/study'
export function useStudy() {
  const { session } = useAuth(); const id = session?.user.id
  const [courses, setCourses] = useState<Course[]>([]); const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setCourses([]); setTasks([])
    if (!id) { setLoading(false); return }
    Promise.all([
      client().from('study_courses').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      client().from('tasks').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    ]).then(([c, t]) => {
      if (!active) return
      if (c.error || t.error) throw c.error ?? t.error
      setCourses(c.data); setTasks(t.data)
    }).catch(e => { if (active) setError(friendlyError(e)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, revision])
  return { courses, tasks, loading, error, reload: () => setRevision(n => n + 1) }
}
