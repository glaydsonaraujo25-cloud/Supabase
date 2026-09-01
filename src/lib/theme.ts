import { useSyncExternalStore } from 'react'
export type ThemeMode = 'light' | 'dark' | 'system'
const key = 'study-theme'
let mode: ThemeMode = 'light'
const listeners = new Set<()=>void>()
const valid = (value: string | null): ThemeMode => value === 'dark' || value === 'system' ? value : 'light'
function apply() {
 const dark = mode === 'dark' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
 document.documentElement.dataset.theme = dark ? 'dark' : 'light'
 document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark ? '#121b18' : '#ffffff')
 listeners.forEach(listener=>listener())
}
export function setTheme(value: ThemeMode) {
 mode = valid(value)
 try { localStorage.setItem(key,mode) } catch { /* Theme still works for this page. */ }
 apply()
}
export function initializeTheme() {
 try { mode=valid(localStorage.getItem(key)) } catch { mode='light' }
 const media=window.matchMedia?.('(prefers-color-scheme: dark)')
 const onSystem=()=>{if(mode==='system')apply()}
 const onStorage=(event:StorageEvent)=>{if(event.key===key||event.key===null){mode=valid(event.newValue);apply()}}
 media?.addEventListener('change',onSystem);window.addEventListener('storage',onStorage);apply()
 return ()=>{media?.removeEventListener('change',onSystem);window.removeEventListener('storage',onStorage)}
}
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}}
export function useThemeMode() {return useSyncExternalStore(subscribe,()=>mode,()=> 'light' as ThemeMode)}
