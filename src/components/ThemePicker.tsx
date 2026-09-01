import { setTheme, useThemeMode, type ThemeMode } from '../lib/theme'
export function ThemePicker() {
 const mode=useThemeMode()
 return <label className="theme-picker">Aparência<select aria-label="Aparência" value={mode} onChange={event=>setTheme(event.target.value as ThemeMode)}><option value="light">Claro</option><option value="dark">Escuro</option><option value="system">Automático</option></select></label>
}
