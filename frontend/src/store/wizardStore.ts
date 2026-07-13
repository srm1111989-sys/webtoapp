import { create } from 'zustand'
import type { AppConfig, NavigationItem, FirebaseConfig, AdmobConfig, DesktopConfig } from '@/types'

export type Platform = 'android' | 'desktop' | 'ios'

interface WizardState {
  step: number
  appId: string | null
  selectedPlatforms: Platform[]
  name: string
  url: string
  packageName: string
  versionCode: number | null
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
  customKeystoreFile: File | null
  customKeystoreUrl: string | null
  customKeystorePassword: string
  customKeystoreAlias: string
  customKeystorePrivatePassword: string
  selectedPlanId: string | null
  existingOrderId: string | null

  setStep: (step: number) => void
  setAppId: (id: string) => void
  setExistingOrderId: (id: string | null) => void
  setSelectedPlatforms: (platforms: Platform[]) => void
  setBasicInfo: (data: { name: string; url: string; packageName?: string; versionCode?: number | null; description?: string }) => void
  setVisuals: (data: Partial<Pick<WizardState, 'primaryColor' | 'secondaryColor' | 'statusBarColor' | 'iconFile' | 'iconPreview' | 'splashFile' | 'splashPreview'>>) => void
  setFeatures: (features: Record<string, boolean>) => void
  setNavigation: (type: 'none' | 'bottom_nav' | 'drawer', items: NavigationItem[]) => void
  setAdvanced: (data: Partial<Pick<WizardState, 'firebaseConfig' | 'admobConfig' | 'customUserAgent' | 'customKeystoreFile' | 'customKeystoreUrl' | 'customKeystorePassword' | 'customKeystoreAlias' | 'customKeystorePrivatePassword'>>) => void
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
  versionCode: null,
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
  features: {
    push_notifications: true,
    admob: true,
    biometric_auth: true,
    deep_linking: true,
    offline_mode: true,
    navigation_menu: true,
    qr_scanner: true,
    js_bridge: true,
    screenshot_prevention: true,
    file_upload: true,
    location_services: true,
    camera_access: true,
    onboarding_screen: true,
    app_shortcut: true,
    secondary_navigation: true,
    social_login: true,
    in_app_update: true,
    background_location: true,
    facebook_app_events: true,
    in_app_purchases: true,
    in_app_review: true,
    background_service: true,
    native_contacts: true,
    appsflyer: true,
    custom_media_player: true,
    offer_card: true,
    intercom: true,
    dynamic_app_icon: true,
    bluetooth_connectivity: true,
    download_file_manager: true,
    floating_action_menu: true,
    revenue_cat: true,
    native_datastore: true,
    passcode_lock: true,
    app_auto_launch: true,
    advanced_bottom_navigation: true,
    firebase_notification: true,
    tap_to_pay: true,
  } as Record<string, boolean>,
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
  customKeystoreFile: null,
  customKeystoreUrl: null,
  customKeystorePassword: '',
  customKeystoreAlias: '',
  customKeystorePrivatePassword: '',
  selectedPlanId: null,
  existingOrderId: null,
}

export const useWizardStore = create<WizardState>()((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setAppId: (appId) => set({ appId }),
  setExistingOrderId: (existingOrderId) => set({ existingOrderId }),
  setSelectedPlatforms: (selectedPlatforms) => set({ selectedPlatforms }),
  setBasicInfo: (data) => set({
    name: data.name,
    url: data.url,
    packageName: data.packageName || '',
    versionCode: data.versionCode ?? null,
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
