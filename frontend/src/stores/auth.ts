import { create } from 'zustand'
import { api } from '../lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ token: data.access_token, user: data.user })
  },

  register: async (email, password, name) => {
    const data = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ token: data.access_token, user: data.user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    set({ token: null, user: null })
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
