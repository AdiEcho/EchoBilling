import { create } from 'zustand'

type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'echobilling-theme'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: (theme) => {
    const resolved = resolveTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(resolved)
    set({ theme, resolvedTheme: resolved })
  },
  toggleTheme: () => {
    const current = get().theme
    const next: ThemeMode = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
    get().setTheme(next)
  },
}))

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  const theme: ThemeMode = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system'
  const resolved = resolveTheme(theme)
  applyTheme(resolved)
  useThemeStore.setState({ theme, resolvedTheme: resolved })

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', () => {
    const state = useThemeStore.getState()
    if (state.theme === 'system') {
      const newResolved = getSystemTheme()
      applyTheme(newResolved)
      useThemeStore.setState({ resolvedTheme: newResolved })
    }
  })
}
