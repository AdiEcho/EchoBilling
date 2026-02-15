import { create } from 'zustand'
import { api } from '../lib/utils'

interface BrandingState {
  siteName: string
  companyLegalName: string
  siteDomain: string
  loaded: boolean
  fetchBranding: () => Promise<void>
}

export const useBrandingStore = create<BrandingState>((set, get) => ({
  siteName: '',
  companyLegalName: '',
  siteDomain: '',
  loaded: false,

  fetchBranding: async () => {
    if (get().loaded) return
    try {
      const data = await api<Record<string, string>>('/settings/public')
      const siteName = data.site_name || ''
      const companyLegalName = data.company_legal_name || ''
      const siteDomain = data.site_domain || ''
      set({ siteName, companyLegalName, siteDomain, loaded: true })
      if (siteName) document.title = siteName
    } catch {
      set({ loaded: true })
    }
  },
}))
