import { beforeEach, expect, it, vi } from 'vitest'
const mock=vi.hoisted(()=>({responses:[] as unknown[],eq:vi.fn(),gt:vi.fn(),calls:0}))
vi.mock('./supabase',()=>({client:()=>({from:()=>{const q={select:()=>q,eq:(...args:unknown[])=>{mock.eq(...args);return q},order:()=>q,limit:()=>q,gt:(...args:unknown[])=>{mock.gt(...args);return q},abortSignal:()=>q,then:(resolve:(value:unknown)=>unknown)=>{mock.calls++;return Promise.resolve(mock.responses.shift()).then(resolve)}};return q}})}))
import { loadOwned } from './loadOwned'
beforeEach(()=>{vi.clearAllMocks();mock.calls=0;mock.responses=[]})
it('continues past server-capped short batches and scopes every request',async()=>{mock.responses=[{data:[{id:'a'},{id:'b'}]},{data:[{id:'c'}]},{data:[]}];expect(await loadOwned('tasks','owner')).toHaveLength(3);expect(mock.calls).toBe(3);expect(mock.eq.mock.calls).toEqual(Array(3).fill(['user_id','owner']));expect(mock.gt.mock.calls).toEqual([['id','b'],['id','c']])})
it('rejects rather than returning a partial export after an error',async()=>{mock.responses=[{data:[{id:'a'}]},{error:new Error('offline')}];await expect(loadOwned('tasks','owner')).rejects.toThrow('offline')})
it('stops requests after cancellation',async()=>{const controller=new AbortController();controller.abort();await expect(loadOwned('tasks','owner',controller.signal)).rejects.toThrow('Aborted');expect(mock.calls).toBe(0)})
it('fails safely if the server repeats the cursor',async()=>{mock.responses=[{data:[{id:'a'}]},{data:[{id:'a'}]}];await expect(loadOwned('tasks','owner')).rejects.toThrow('cursor')})
