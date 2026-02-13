import { create } from 'zustand'
import { api } from '../lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
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
    const data = await api<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('token', data.access_token)
    set({ token: data.access_token, user: data.user })
  },

  register: async (email, password, name) => {
    const data = await api<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    localStorage.setItem('token', data.access_token)
    set({ token: data.access_token, user: data.user })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },

  loadUser: async () => {
    const { token } = get()
    if (!token) return
    set({ isLoading: true })
    try {
      const user = await api<User>('/auth/me', { token })
      set({ user, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, isLoading: false })
    }
  },
}))
