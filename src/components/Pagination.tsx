import { useState } from 'react'
export function usePagination<T>(items: T[], filterKey: string) {
 const [selection, setSelection] = useState({ key: filterKey, page: 1 })
 const pages = Math.max(1, Math.ceil(items.length / 20))
 const page = selection.key === filterKey ? Math.min(selection.page, pages) : 1
 return { items: items.slice((page - 1) * 20, page * 20), page, pages, total: items.length,
  onChange: (next: number) => setSelection({ key: filterKey, page: Math.max(1, Math.min(next, pages)) }) }
}
export function Pagination({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (page: number) => void }) {
 if (pages <= 1) return null
 return <nav className="pagination" aria-label="Páginas dos resultados"><button className="secondary" disabled={page===1} onClick={()=>onChange(page-1)}>Anterior</button><span role="status">Página {page} de {pages} · {total} resultados</span><button className="secondary" disabled={page===pages} onClick={()=>onChange(page+1)}>Próxima</button></nav>
}
