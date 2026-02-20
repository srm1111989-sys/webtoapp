import { create } from 'zustand'
import type { AppConfig, NavigationItem, FirebaseConfig, AdmobConfig } from '@/types'

export type Platform = 'android' | 'ios'

interface WizardState {
  step: number
  appId: string | null
  selectedPlatforms: Platform[]
  name: string
  url: string
  packageName: string
  bundleId: string
  teamId: string
  description: string
  iconFile: File | null
  iconPreview: string | null
  splashFile: File | null
  splashPreview: string | null
  primaryColor: string
  secondaryColor: string
  statusBarColor: string
  navigationType: 'none' | 'bottom_nav' | 'drawer'
  navigationItems: NavigationItem[]
  features: Record<string, boolean>
  firebaseConfig: FirebaseConfig | null
  admobConfig: AdmobConfig | null
  customUserAgent: string
  selectedPlanId: string | null

  setStep: (step: number) => void
  setAppId: (id: string) => void
  setSelectedPlatforms: (platforms: Platform[]) => void
  setBasicInfo: (data: { name: string; url: string; packageName?: string; bundleId?: string; teamId?: string; description?: string }) => void
  setVisuals: (data: Partial<Pick<WizardState, 'primaryColor' | 'secondaryColor' | 'statusBarColor' | 'iconFile' | 'iconPreview' | 'splashFile' | 'splashPreview'>>) => void
  setFeatures: (features: Record<string, boolean>) => void
  setNavigation: (type: 'none' | 'bottom_nav' | 'drawer', items: NavigationItem[]) => void
  setAdvanced: (data: Partial<Pick<WizardState, 'firebaseConfig' | 'admobConfig' | 'customUserAgent'>>) => void
  setPlan: (planId: string) => void
  reset: () => void
}

const initialState = {
  step: 0,
  appId: null,
  selectedPlatforms: ['android'] as Platform[],
  name: '',
  url: '',
  packageName: '',
  bundleId: '',
  teamId: '',
  description: '',
  iconFile: null,
  iconPreview: null,
  splashFile: null,
  splashPreview: null,
  primaryColor: '#2563EB',
  secondaryColor: '#1E40AF',
  statusBarColor: '#1E3A5F',
  navigationType: 'none' as const,
  navigationItems: [],
  features: {},
  firebaseConfig: null,
  admobConfig: null,
  customUserAgent: '',
  selectedPlanId: null,
}

export const useWizardStore = create<WizardState>()((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setAppId: (appId) => set({ appId }),
  setSelectedPlatforms: (selectedPlatforms) => set({ selectedPlatforms }),
  setBasicInfo: (data) => set({
    name: data.name,
    url: data.url,
    packageName: data.packageName || '',
    bundleId: data.bundleId || '',
    teamId: data.teamId || '',
    description: data.description || '',
  }),
  setVisuals: (data) => set(data),
  setFeatures: (features) => set({ features }),
  setNavigation: (navigationType, navigationItems) => set({ navigationType, navigationItems }),
  setAdvanced: (data) => set(data),
  setPlan: (selectedPlanId) => set({ selectedPlanId }),
  reset: () => set(initialState),
}))
