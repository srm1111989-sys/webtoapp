import { create } from 'zustand'
import type { AppConfig, NavigationItem, FirebaseConfig, AdmobConfig, DesktopConfig } from '@/types'

export type Platform = 'android' | 'desktop'

interface WizardState {
  step: number
  appId: string | null
  selectedPlatforms: Platform[]
  name: string
  url: string
  packageName: string
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
  desktopConfig: DesktopConfig
  customUserAgent: string
  selectedPlanId: string | null

  setStep: (step: number) => void
  setAppId: (id: string) => void
  setSelectedPlatforms: (platforms: Platform[]) => void
  setBasicInfo: (data: { name: string; url: string; packageName?: string; description?: string }) => void
  setVisuals: (data: Partial<Pick<WizardState, 'primaryColor' | 'secondaryColor' | 'statusBarColor' | 'iconFile' | 'iconPreview' | 'splashFile' | 'splashPreview'>>) => void
  setFeatures: (features: Record<string, boolean>) => void
  setNavigation: (type: 'none' | 'bottom_nav' | 'drawer', items: NavigationItem[]) => void
  setAdvanced: (data: Partial<Pick<WizardState, 'firebaseConfig' | 'admobConfig' | 'customUserAgent'>>) => void
  setDesktopConfig: (config: Partial<DesktopConfig>) => void
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
  desktopConfig: {
    window_width: 1280,
    window_height: 800,
    min_width: 800,
    min_height: 600,
    show_title_bar: true,
    show_menu_bar: false,
    enable_system_tray: false,
    start_maximized: false,
    start_fullscreen: false,
  },
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
    description: data.description || '',
  }),
  setVisuals: (data) => set(data),
  setFeatures: (features) => set({ features }),
  setNavigation: (navigationType, navigationItems) => set({ navigationType, navigationItems }),
  setAdvanced: (data) => set(data),
  setDesktopConfig: (config) => set((state) => ({
    desktopConfig: { ...state.desktopConfig, ...config },
  })),
  setPlan: (selectedPlanId) => set({ selectedPlanId }),
  reset: () => set(initialState),
}))
