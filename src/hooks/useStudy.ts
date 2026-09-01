import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { loadOwned } from '../lib/loadOwned'
import { friendlyError } from '../lib/errors'
import type { Course, Task } from '../types/study'
export function useStudy() {
  const { session } = useAuth(); const id = session?.user.id
  const [courses, setCourses] = useState<Course[]>([]); const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController(); let active = true; setLoading(true); setError(''); setCourses([]); setTasks([])
    if (!id) { setLoading(false); return }
    Promise.all([
      loadOwned<Course>('study_courses', id, controller.signal),
      loadOwned<Task>('tasks', id, controller.signal),
    ]).then(([c, t]) => {
      if (!active) return
      setCourses(c.sort((a,b)=>b.created_at.localeCompare(a.created_at))); setTasks(t.sort((a,b)=>b.created_at.localeCompare(a.created_at)))
    }).catch(e => { if (active) setError(friendlyError(e)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [id, revision])
  return { courses, tasks, loading, error, reload: () => setRevision(n => n + 1) }
}
