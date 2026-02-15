import { create } from 'zustand'
import { api } from '../lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: string
  two_factor_enabled: boolean
  created_at: string
}

interface AuthResponse {
  access_token?: string
  refresh_token?: string
  user?: User
  requires_2fa?: boolean
  two_factor_token?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  twoFactorRequired: boolean
  twoFactorToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
  verify2FA: (code: string, method: string) => Promise<void>
  send2FAEmailCode: () => Promise<void>
  clear2FAState: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  twoFactorRequired: false,
  twoFactorToken: null,

  login: async (email, password) => {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (data.requires_2fa && data.two_factor_token) {
      set({
        twoFactorRequired: true,
        twoFactorToken: data.two_factor_token,
      })
      return
    }

    if (data.access_token && data.refresh_token) {
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({
        token: data.access_token,
        user: data.user || null,
        twoFactorRequired: false,
        twoFactorToken: null,
      })
    }
  },

  verify2FA: async (code, method) => {
    const { twoFactorToken } = get()
    if (!twoFactorToken) throw new Error('No 2FA token')

    const data = await api<AuthResponse>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        two_factor_token: twoFactorToken,
        code,
        method,
      }),
    })

    if (data.access_token && data.refresh_token) {
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({
        token: data.access_token,
        user: data.user || null,
        twoFactorRequired: false,
        twoFactorToken: null,
      })
    }
  },

  send2FAEmailCode: async () => {
    const { twoFactorToken } = get()
    if (!twoFactorToken) throw new Error('No 2FA token')

    await api('/auth/2fa/email/send', {
      method: 'POST',
      body: JSON.stringify({
        two_factor_token: twoFactorToken,
      }),
    })
  },

  clear2FAState: () => {
    set({
      twoFactorRequired: false,
      twoFactorToken: null,
    })
  },

  register: async (email, password, name) => {
    const data = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    if (data.access_token && data.refresh_token) {
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ token: data.access_token, user: data.user || null })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    set({ token: null, user: null, twoFactorRequired: false, twoFactorToken: null })
  },

  loadUser: async () => {
    const { token } = get()
    if (!token) return
    set({ isLoading: true })
    try {
      const user = await api<User>('/auth/me')
      set({ user, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      set({ token: null, user: null, isLoading: false })
    }
  },
}))
