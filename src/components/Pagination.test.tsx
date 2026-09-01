// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import { usePagination } from './Pagination'
it('changes pages and resets when filters change',()=>{const items=Array.from({length:45},(_,i)=>i);const {result,rerender}=renderHook(({key})=>usePagination(items,key),{initialProps:{key:'all'}});expect(result.current.items).toHaveLength(20);act(()=>result.current.onChange(3));expect(result.current.items).toEqual([40,41,42,43,44]);rerender({key:'filtered'});expect(result.current.page).toBe(1)})
it('clamps the current page after records are removed',()=>{const {result,rerender}=renderHook(({count})=>usePagination(Array.from({length:count},(_,i)=>i),'all'),{initialProps:{count:41}});act(()=>result.current.onChange(3));rerender({count:20});expect(result.current.page).toBe(1);expect(result.current.items).toHaveLength(20)})
