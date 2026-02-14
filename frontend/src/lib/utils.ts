import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE = '/api/v1'

interface FetchOptions extends RequestInit {
  token?: string
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) return null

    const data = await res.json()
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    return data.access_token as string
  } catch {
    return null
  }
}

export async function api<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  }

  // 自动从 localStorage 读取 token（手动传入的 token 优先）
  const authToken = token ?? localStorage.getItem('token')
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${API_BASE}${path}`, { headers, ...rest })

  if (!res.ok) {
    // 401 时尝试用 refresh_token 刷新
    if (res.status === 401 && !path.startsWith('/auth/')) {
      // 避免并发刷新：复用同一个 refresh promise
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = tryRefreshToken().finally(() => {
          isRefreshing = false
          refreshPromise = null
        })
      }

      const newToken = await refreshPromise
      if (newToken) {
        // 刷新成功，用新 token 重试原请求
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetch(`${API_BASE}${path}`, { headers, ...rest })
        if (retryRes.ok) {
          return retryRes.json()
        }
      }

      // 刷新失败，清除 token 并跳转登录
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}
