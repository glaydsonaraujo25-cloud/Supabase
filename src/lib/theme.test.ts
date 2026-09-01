// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { initializeTheme, setTheme } from './theme'
let change:()=>void;let dark=false;let dispose:()=>void
beforeEach(()=>{localStorage.clear();dark=false;vi.stubGlobal('matchMedia',()=>({get matches(){return dark},addEventListener:(_:string,fn:()=>void)=>{change=fn},removeEventListener:vi.fn()}));dispose=initializeTheme()})
afterEach(()=>{dispose();vi.restoreAllMocks();vi.unstubAllGlobals()})
it('starts light and restores a saved selection',()=>{expect(document.documentElement.dataset.theme).toBe('light');setTheme('dark');expect(localStorage.getItem('study-theme')).toBe('dark');dispose();dispose=initializeTheme();expect(document.documentElement.dataset.theme).toBe('dark')})
it('follows system changes only in automatic mode',()=>{setTheme('system');dark=true;change();expect(document.documentElement.dataset.theme).toBe('dark');setTheme('light');change();expect(document.documentElement.dataset.theme).toBe('light')})
it('responds to another tab and safely handles invalid settings',()=>{window.dispatchEvent(new StorageEvent('storage',{key:'study-theme',newValue:'dark'}));expect(document.documentElement.dataset.theme).toBe('dark');window.dispatchEvent(new StorageEvent('storage',{key:'study-theme',newValue:'invalid'}));expect(document.documentElement.dataset.theme).toBe('light')})
it('works when browser storage is blocked',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')});expect(()=>setTheme('dark')).not.toThrow();expect(document.documentElement.dataset.theme).toBe('dark')})
