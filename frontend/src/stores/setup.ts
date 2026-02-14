import { create } from 'zustand'
import { api } from '../lib/utils'

interface SetupState {
  needsSetup: boolean | null // null = 未检测
  isChecking: boolean
  checkSetupStatus: () => Promise<void>
}

export const useSetupStore = create<SetupState>((set) => ({
  needsSetup: null,
  isChecking: true,

  checkSetupStatus: async () => {
    set({ isChecking: true })
    try {
      const data = await api<{ needs_setup: boolean }>('/setup/status')
      set({ needsSetup: data.needs_setup, isChecking: false })
    } catch {
      // 接口失败时默认不需要 setup，避免阻塞正常使用
      set({ needsSetup: false, isChecking: false })
    }
  },
}))
