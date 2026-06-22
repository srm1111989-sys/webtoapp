import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { HexColorPicker } from 'react-colorful'
import toast from 'react-hot-toast'
import {
  Globe,
  Smartphone,
  Monitor,
  Bell,
  DollarSign,
  Fingerprint,
  Link2,
  WifiOff,
  Menu,
  QrCode,
  Code2,
  ShieldOff,
  Upload,
  MapPin,
  Camera,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  X,
  ExternalLink,
  FlaskConical,
  BookOpen,
  Zap,
  LayoutList,
  Users,
  RefreshCw,
  MapPinned,
  BarChart3,
  CreditCard,
  Star,
  Server,
  Contact,
  Activity,
  Play,
  Gift,
  MessageCircle,
  Palette,
  Bluetooth,
  FolderDown,
  CirclePlus,
  Wallet,
  Database,
  Lock,
  Power,
  PanelBottom,
  BellRing,
  Nfc,
  Store,
} from 'lucide-react'
import { useWizardStore, type Platform } from '@/store/wizardStore'
import { appsApi } from '@/api/apps'
import { ordersApi, buildsApi, paymentsApi, plansApi } from '@/api/orders'
import { createRazorpayOrder, verifyRazorpayPayment } from '@/api/razorpay-proxy'
import { trackPurchase, trackBeginCheckout, trackFreeAppBuild, trackAppCreated } from '@/utils/gtag'
import type { Plan, NavigationItem } from '@/types'
import { formatPlanPrice, getUserCurrency } from '@/utils/format'

// ---------- Step 0: Basic Info ----------

const basicInfoSchema = z.object({
  name: z.string().min(1, 'App name is required').max(100),
  url: z.string().url('Please enter a valid URL'),
  package_name: z.string().optional(),
  description: z.string().max(500).optional(),
})

type BasicInfoData = z.infer<typeof basicInfoSchema>

// ---------- Feature definitions ----------

const FEATURES = [
  { key: 'push_notifications', label: 'Push Notifications', description: 'Send real-time push notifications to users via Firebase Cloud Messaging (FCM). Engage users with timely updates, promotions, and alerts.', helpUrl: 'https://firebase.google.com/docs/cloud-messaging', icon: Bell },
  { key: 'admob', label: 'AdMob Ads', description: 'Monetize your app with Google AdMob banner, interstitial, and rewarded ads. Earn revenue from ad impressions and clicks.', helpUrl: 'https://admob.google.com/home/', icon: DollarSign },
  { key: 'biometric_auth', label: 'Biometric Auth', description: 'Secure your app with fingerprint or face unlock authentication. Provides enhanced security and convenience for users.', helpUrl: 'https://developer.android.com/training/sign-in/biometric-auth', icon: Fingerprint },
  { key: 'deep_linking', label: 'Deep Linking', description: 'Handle deep links and custom URL schemes to navigate users directly to specific content within your app from external sources.', helpUrl: 'https://developer.android.com/training/app-links/deep-linking', icon: Link2 },
  { key: 'offline_mode', label: 'Offline Mode', description: 'Cache website content locally for offline access. Users can view previously loaded pages without internet connection.', helpUrl: 'https://developer.android.com/training/data-storage', icon: WifiOff },
  { key: 'navigation_menu', label: 'Navigation Menu', description: 'Add custom bottom navigation bar or drawer menu with multiple tabs/items. Configure menu items with icons and URLs.', helpUrl: 'https://m2.material.io/components/bottom-navigation', icon: Menu },
  { key: 'qr_scanner', label: 'QR Scanner', description: 'Built-in QR code and barcode scanner using device camera. Scan codes directly within your app without external apps.', helpUrl: 'https://developer.android.com/training/camerax', icon: QrCode },
  { key: 'js_bridge', label: 'JS Bridge', description: 'JavaScript-to-native bridge for bi-directional communication. Call native Android functions from your website JavaScript.', helpUrl: 'https://developer.android.com/develop/ui/views/layout/webapps/webview', icon: Code2 },
  { key: 'screenshot_prevention', label: 'Screenshot Prevention', description: 'Block users from taking screenshots or screen recordings within your app for enhanced content security and privacy.', helpUrl: 'https://developer.android.com/reference/android/view/WindowManager.LayoutParams#FLAG_SECURE', icon: ShieldOff },
  { key: 'file_upload', label: 'File Upload', description: 'Enable file uploads from device storage, camera, or gallery. Users can upload documents, images, and videos to your website.', helpUrl: 'https://developer.android.com/training/data-storage/shared/documents-files', icon: Upload },
  { key: 'location_services', label: 'Location Services', description: 'Access device GPS location to provide location-based features. Get real-time coordinates for mapping and proximity services.', helpUrl: 'https://developer.android.com/training/location', icon: MapPin },
  { key: 'camera_access', label: 'Camera Access', description: 'Direct access to device camera for taking photos and videos. Capture media without leaving your app.', helpUrl: 'https://developer.android.com/training/camerax', icon: Camera },
  { key: 'onboarding_screen', label: 'Onboarding Screen', description: 'Welcome screens with tutorials for first-time users. Create engaging onboarding flow with images and descriptions.', helpUrl: 'https://m2.material.io/design/communication/onboarding.html', icon: BookOpen },
  { key: 'app_shortcut', label: 'App Shortcut', description: 'Home screen quick action shortcuts for common tasks. Long-press app icon to reveal shortcut menu.', helpUrl: 'https://developer.android.com/develop/ui/views/launch/shortcuts', icon: Zap },
  { key: 'secondary_navigation', label: 'Secondary Navigation', description: 'Additional navigation options beyond primary menu. Add tabs, segments, or hierarchical navigation.', helpUrl: 'https://m2.material.io/components/navigation', icon: LayoutList },
  { key: 'social_login', label: 'Social Login', description: 'Sign in with Google, Facebook, Twitter, and other social accounts. Simplify user authentication with OAuth.', helpUrl: 'https://developers.google.com/identity/sign-in/android/start', icon: Users },
  { key: 'in_app_update', label: 'In-App Update', description: 'Prompt users to update the app when new version is available on Play Store. Flexible or immediate update flows.', helpUrl: 'https://developer.android.com/guide/playcore/in-app-updates', icon: RefreshCw },
  { key: 'background_location', label: 'Background Location', description: 'Track user location even when app is in background. Useful for delivery, tracking, and fitness apps.', helpUrl: 'https://developer.android.com/training/location/background', icon: MapPinned },
  { key: 'facebook_app_events', label: 'Facebook App Events', description: 'Track custom events with Facebook Analytics SDK for ad optimization and user behavior insights.', helpUrl: 'https://developers.facebook.com/docs/app-events/android', icon: BarChart3 },
  { key: 'in_app_purchases', label: 'In-App Purchases', description: 'Sell digital goods, subscriptions, and premium features via Google Play Billing. Monetize your app content.', helpUrl: 'https://developer.android.com/google/play/billing', icon: CreditCard },
  { key: 'in_app_review', label: 'In-App Review', description: 'Prompt users to rate and review your app within the app using Google Play In-App Review API.', helpUrl: 'https://developer.android.com/guide/playcore/in-app-review', icon: Star },
  { key: 'background_service', label: 'Background Service', description: 'Run tasks in background such as syncing data, processing jobs, or handling long-running operations.', helpUrl: 'https://developer.android.com/develop/background-work/services', icon: Server },
  { key: 'native_contacts', label: 'Native Contacts', description: 'Access and manage device contacts. Read, search, and add contacts programmatically from your app.', helpUrl: 'https://developer.android.com/training/contacts-provider', icon: Contact },
  { key: 'appsflyer', label: 'AppsFlyer', description: 'Mobile attribution and analytics platform. Track installs, campaigns, and user acquisition sources.', helpUrl: 'https://www.appsflyer.com/resources/guides/android-sdk-integration/', icon: Activity },
  { key: 'custom_media_player', label: 'Custom Media Player', description: 'Built-in audio and video player with custom controls. Stream or play local media files.', helpUrl: 'https://developer.android.com/guide/topics/media/exoplayer', icon: Play },
  { key: 'offer_card', label: 'Offer Card', description: 'Display promotional cards with offers, deals, and announcements. Eye-catching banners for marketing.', helpUrl: 'https://m2.material.io/components/cards', icon: Gift },
  { key: 'intercom', label: 'Intercom', description: 'In-app customer messaging and support chat. Engage users with real-time conversations and help articles.', helpUrl: 'https://developers.intercom.com/installing-intercom/docs/android-installation', icon: MessageCircle },
  { key: 'dynamic_app_icon', label: 'Dynamic App Icon', description: 'Change app icon dynamically based on themes, events, or user preferences without app update.', helpUrl: 'https://developer.android.com/develop/ui/views/launch/icon', icon: Palette },
  { key: 'bluetooth_connectivity', label: 'Bluetooth Connectivity', description: 'Connect to Bluetooth devices like printers, sensors, wearables, and IoT devices.', helpUrl: 'https://developer.android.com/guide/topics/connectivity/bluetooth', icon: Bluetooth },
  { key: 'download_file_manager', label: 'Download Manager', description: 'Manage and track file downloads within your app. Download progress, pause, resume functionality.', helpUrl: 'https://developer.android.com/reference/android/app/DownloadManager', icon: FolderDown },
  { key: 'floating_action_menu', label: 'Floating Action Menu', description: 'Floating action button (FAB) with expandable menu options for quick access to key actions.', helpUrl: 'https://m2.material.io/components/buttons-floating-action-button', icon: CirclePlus },
  { key: 'revenue_cat', label: 'Revenue Cat', description: 'Subscription and in-app purchase management via RevenueCat. Cross-platform subscription infrastructure.', helpUrl: 'https://www.revenuecat.com/docs/getting-started/installation/android', icon: Wallet },
  { key: 'native_datastore', label: 'Native Datastore', description: 'Local data storage on device using Room database or DataStore. Persist app data securely offline.', helpUrl: 'https://developer.android.com/training/data-storage', icon: Database },
  { key: 'passcode_lock', label: 'Passcode Lock', description: 'Secure your app with PIN or pattern lock. Require authentication before accessing app content.', helpUrl: 'https://developer.android.com/training/sign-in/credentials', icon: Lock },
  { key: 'app_auto_launch', label: 'App Auto Launch', description: 'Automatically launch app when device boots up. Useful for kiosk mode or background services.', helpUrl: 'https://developer.android.com/training/scheduling/wakelock', icon: Power },
  { key: 'advanced_bottom_navigation', label: 'Advanced Bottom Nav', description: 'Enhanced bottom navigation with badges, animations, and advanced customization options.', helpUrl: 'https://m3.material.io/components/navigation-bar', icon: PanelBottom },
  { key: 'firebase_notification', label: 'Firebase Notification', description: 'Firebase Cloud Messaging (FCM) for push notifications with rich media, actions, and deep links.', helpUrl: 'https://firebase.google.com/docs/cloud-messaging/android/client', icon: BellRing },
  { key: 'tap_to_pay', label: 'Tap to Pay', description: 'NFC-based contactless payment support. Accept tap-to-pay transactions using device NFC hardware.', helpUrl: 'https://developer.android.com/develop/connectivity/nfc', icon: Nfc },
] as const

// ---------- Step indicator ----------

const STEP_LABELS = ['Basic Info', 'Visuals', 'Features', 'Advanced', 'Plan & Review']

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {STEP_LABELS.map((label, idx) => (
          <div key={label} className="flex items-center flex-1 min-w-0 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-colors ${
                  idx < currentStep
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : idx === currentStep
                      ? 'border-primary-600 text-primary-600 bg-white'
                      : 'border-gray-300 text-gray-400 bg-white'
                }`}
              >
                {idx < currentStep ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium text-center hidden sm:block whitespace-nowrap ${
                  idx === currentStep ? 'text-gray-900' : idx < currentStep ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-3 -mt-4 sm:mt-0">
                <div
                  className={`h-px ${idx < currentStep ? 'bg-primary-600' : 'bg-gray-200'}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Image Dropzone ----------

function ImageDropzone({
  label,
  preview,
  onDrop,
  hint,
}: {
  label: string
  preview: string | null
  onDrop: (files: File[]) => void
  hint: string
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop,
  })

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt={label} className="mx-auto max-h-32 rounded-lg object-contain" />
        ) : (
          <div className="text-gray-500">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Drop file here or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Keystore Dropzone ----------

function KeystoreDropzone({
  label,
  fileName,
  onDrop,
  hint,
}: {
  label: string
  fileName: string | null
  onDrop: (files: File[]) => void
  hint: string
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/octet-stream': ['.jks', '.keystore'] },
    maxFiles: 1,
    onDrop,
  })

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {fileName ? (
          <div className="text-gray-700 font-medium flex flex-col items-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm">Selected keystore file:</p>
            <p className="text-xs text-blue-600 font-mono mt-1">{fileName}</p>
          </div>
        ) : (
          <div className="text-gray-500">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Drop .jks or .keystore file here or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Color Picker Section ----------

function ColorPickerField({
  label,
  color,
  onChange,
}: {
  label: string
  color: string
  onChange: (c: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 border rounded-lg px-3 py-2 w-full hover:bg-gray-50"
      >
        <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: color }} />
        <span className="text-sm font-mono">{color}</span>
      </button>
      {open && (
        <div className="mt-2">
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

// ---------- Phone Mockup ----------

function PhoneMockup({
  primaryColor,
  secondaryColor,
  statusBarColor,
  iconPreview,
  appName,
}: {
  primaryColor: string
  secondaryColor: string
  statusBarColor: string
  iconPreview: string | null
  appName: string
}) {
  return (
    <div className="flex justify-center">
      <div className="w-[220px] h-[440px] rounded-[2rem] border-4 border-gray-800 bg-white overflow-hidden shadow-xl relative">
        {/* Status bar */}
        <div className="h-7 flex items-center justify-center px-4" style={{ backgroundColor: statusBarColor }}>
          <span className="text-white text-[10px] font-medium">9:41</span>
        </div>
        {/* App bar */}
        <div className="h-12 flex items-center px-4 gap-2" style={{ backgroundColor: primaryColor }}>
          {iconPreview && (
            <img src={iconPreview} alt="icon" className="w-6 h-6 rounded" />
          )}
          <span className="text-white text-sm font-semibold truncate">
            {appName || 'My App'}
          </span>
        </div>
        {/* Content area */}
        <div className="p-4 space-y-3">
          <div className="h-3 rounded-full bg-gray-200 w-full" />
          <div className="h-3 rounded-full bg-gray-200 w-4/5" />
          <div className="h-20 rounded-lg bg-gray-100 mt-4" />
          <div className="h-3 rounded-full bg-gray-200 w-full" />
          <div className="h-3 rounded-full bg-gray-200 w-3/5" />
        </div>
        {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-around" style={{ backgroundColor: secondaryColor }}>
          <div className="w-5 h-5 rounded bg-white/30" />
          <div className="w-5 h-5 rounded bg-white/30" />
          <div className="w-5 h-5 rounded bg-white/30" />
        </div>
      </div>
    </div>
  )
}

// ---------- Collapsible Section ----------

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  helpUrl,
  helpLabel,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  helpUrl?: string
  helpLabel?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-800">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>
      {open && (
        <div className="p-5 space-y-4">
          {helpUrl && (
            <a
              href={helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {helpLabel || 'How to set this up?'}
            </a>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

// ========== MAIN COMPONENT ==========

export default function CreateApp() {
  const navigate = useNavigate()
  const wizard = useWizardStore()
  const { step } = wizard

  useEffect(() => {
    return () => {
      useWizardStore.getState().reset()
    }
  }, [])

  const setStep = (s: number) => wizard.setStep(s)

  return (
    <div className="max-w-5xl mx-auto py-5 sm:py-6 px-3 sm:px-4">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Create your app</h1>
        <p className="text-sm text-gray-500 mt-0.5">Convert your website into a mobile app in 5 steps</p>
      </div>

      <StepIndicator currentStep={step} />

      <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
        {step === 0 && <Step0BasicInfo />}
        {step === 1 && <Step1Visuals />}
        {step === 2 && <Step2Features />}
        {step === 3 && <Step3Advanced />}
        {step === 4 && <Step4PlanReview />}
      </div>
    </div>
  )
}

// ========== STEP 0 - BASIC INFO ==========

function Step0BasicInfo() {
  const wizard = useWizardStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: wizard.name,
      url: wizard.url,
      package_name: wizard.packageName,
      description: wizard.description,
    },
  })

  const createApp = useMutation({
    mutationFn: (data: BasicInfoData) =>
      appsApi.create({
        name: data.name,
        url: data.url,
        package_name: data.package_name || undefined,
        description: data.description || undefined,
        selected_platforms: wizard.selectedPlatforms,
      }),
    onSuccess: (res) => {
      wizard.setAppId(res.data.id)
      wizard.setBasicInfo({
        name: res.data.name,
        url: res.data.url,
        packageName: res.data.package_name || '',
        description: res.data.description || '',
      })
      trackAppCreated(res.data.name, wizard.selectedPlatforms[0] || 'android')
      wizard.setStep(1)
      toast.success('App created successfully')
    },
    onError: () => {
      toast.error('Failed to create app. Please try again.')
    },
  })

  const updateApp = useMutation({
    mutationFn: (data: BasicInfoData) =>
      appsApi.update(wizard.appId!, {
        name: data.name,
        url: data.url,
        package_name: data.package_name || undefined,
        description: data.description || undefined,
        selected_platforms: wizard.selectedPlatforms,
      }),
    onSuccess: (res) => {
      wizard.setBasicInfo({
        name: res.data.name,
        url: res.data.url,
        packageName: res.data.package_name || '',
        description: res.data.description || '',
      })
      wizard.setStep(1)
    },
    onError: () => {
      toast.error('Failed to update app.')
    },
  })

  const onSubmit = (data: BasicInfoData) => {
    if (wizard.appId) {
      updateApp.mutate(data)
    } else {
      createApp.mutate(data)
    }
  }

  const isLoading = createApp.isPending || updateApp.isPending
  const inputClass = 'w-full border-2 border-gray-300 rounded-xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-gray-400'

  const selectPlatform = (platform: Platform) => {
    wizard.setSelectedPlatforms([platform])
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Platform Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Platform *</label>
        <p className="text-xs text-gray-500 mb-3">Choose where your app will run</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'android' as Platform, icon: Smartphone, title: 'Android', subtitle: 'APK & AAB' },
            { key: 'desktop' as Platform, icon: Monitor, title: 'Desktop', subtitle: 'Windows EXE' },
          ]).map(({ key, icon: Icon, title, subtitle }) => {
            const selected = wizard.selectedPlatforms.includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectPlatform(key)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-colors ${
                  selected
                    ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`p-2 rounded-md ${selected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{title}</div>
                  <div className="text-xs text-gray-500">{subtitle}</div>
                </div>
                {selected && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-base font-semibold text-gray-900 mb-2">App Name *</label>
        <input
          {...register('name')}
          className={inputClass}
          placeholder="My Awesome App"
        />
        {errors.name && <p className="text-red-600 text-sm mt-2 font-medium">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-base font-semibold text-gray-900 mb-2">Website URL *</label>
        <div className="relative">
          <Globe className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
          <input
            {...register('url')}
            className="w-full border-2 border-gray-300 rounded-xl pl-14 pr-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-gray-400"
            placeholder="https://example.com"
          />
        </div>
        {errors.url && <p className="text-red-600 text-sm mt-2 font-medium">{errors.url.message}</p>}
      </div>

      {/* Package Name and Description hidden — both optional and auto/empty by default */}
      <input type="hidden" {...register('package_name')} />
      <input type="hidden" {...register('description')} />

      <div className="flex justify-end pt-6 border-t-2 border-gray-100">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-base hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ========== STEP 1 - VISUAL CUSTOMIZATION ==========

function Step1Visuals() {
  const wizard = useWizardStore()
  const hasAndroid = wizard.selectedPlatforms.includes('android')
  const hasDesktop = wizard.selectedPlatforms.includes('desktop')
  const desktopOnly = hasDesktop && !hasAndroid

  const onIconDrop = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (file) {
        wizard.setVisuals({
          iconFile: file,
          iconPreview: URL.createObjectURL(file),
        })
      }
    },
    [wizard],
  )

  const onSplashDrop = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (file) {
        wizard.setVisuals({
          splashFile: file,
          splashPreview: URL.createObjectURL(file),
        })
      }
    },
    [wizard],
  )

  const uploadFiles = useMutation({
    mutationFn: async () => {
      if (!wizard.appId) throw new Error('No app ID')
      if (wizard.iconFile) {
        await appsApi.uploadIcon(wizard.appId, wizard.iconFile)
      }
      if (wizard.splashFile && hasAndroid) {
        await appsApi.uploadSplash(wizard.appId, wizard.splashFile)
      }
      await appsApi.update(wizard.appId, {
        primary_color: wizard.primaryColor,
        secondary_color: wizard.secondaryColor,
        status_bar_color: wizard.statusBarColor,
      })
    },
    onSuccess: () => {
      wizard.setStep(2)
    },
    onError: () => {
      toast.error('Failed to save visuals.')
    },
  })

  const handleNext = () => {
    uploadFiles.mutate()
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Controls */}
        <div className="space-y-6">
          <ImageDropzone
            label="App Icon"
            preview={wizard.iconPreview}
            onDrop={onIconDrop}
            hint={desktopOnly ? '256x256px recommended, PNG or ICO' : '512x512px recommended, PNG or JPG'}
          />

          {hasAndroid && (
            <ImageDropzone
              label="Splash Screen"
              preview={wizard.splashPreview}
              onDrop={onSplashDrop}
              hint="1080x1920px recommended"
            />
          )}

          <ColorPickerField
            label="Primary Color"
            color={wizard.primaryColor}
            onChange={(c) => wizard.setVisuals({ primaryColor: c })}
          />

          <ColorPickerField
            label="Secondary Color"
            color={wizard.secondaryColor}
            onChange={(c) => wizard.setVisuals({ secondaryColor: c })}
          />

          {hasAndroid && (
            <ColorPickerField
              label="Status Bar Color"
              color={wizard.statusBarColor}
              onChange={(c) => wizard.setVisuals({ statusBarColor: c })}
            />
          )}
        </div>

        {/* Right: Preview */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Live Preview</h3>
          {desktopOnly ? (
            <div className="w-[320px] rounded-lg border-2 border-gray-300 bg-white overflow-hidden shadow-lg">
              {/* Title bar */}
              <div className="h-8 flex items-center px-3 gap-2" style={{ backgroundColor: wizard.primaryColor }}>
                {wizard.iconPreview && (
                  <img src={wizard.iconPreview} alt="icon" className="w-4 h-4 rounded-sm" />
                )}
                <span className="text-white text-xs font-medium truncate">
                  {wizard.name || 'My App'}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-white/30" />
                  <div className="w-3 h-3 rounded-sm bg-white/30" />
                  <div className="w-3 h-3 rounded-sm bg-white/30" />
                </div>
              </div>
              {/* Content area */}
              <div className="p-4 space-y-3 h-[200px]">
                <div className="h-3 rounded-full bg-gray-200 w-full" />
                <div className="h-3 rounded-full bg-gray-200 w-4/5" />
                <div className="h-16 rounded-lg bg-gray-100 mt-3" />
                <div className="h-3 rounded-full bg-gray-200 w-full" />
                <div className="h-3 rounded-full bg-gray-200 w-3/5" />
              </div>
            </div>
          ) : (
            <PhoneMockup
              primaryColor={wizard.primaryColor}
              secondaryColor={wizard.secondaryColor}
              statusBarColor={wizard.statusBarColor}
              iconPreview={wizard.iconPreview}
              appName={wizard.name}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => wizard.setStep(0)}
          className="flex items-center gap-2 text-gray-600 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={uploadFiles.isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploadFiles.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ========== STEP 2 - FEATURES ==========

function Step2Features() {
  const wizard = useWizardStore()
  const [features, setFeatures] = useState<Record<string, boolean>>(wizard.features)

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!wizard.appId) throw new Error('No app ID')
      return appsApi.update(wizard.appId, { features })
    },
    onSuccess: () => {
      wizard.setFeatures(features)
      wizard.setStep(3)
    },
    onError: () => {
      toast.error('Failed to save features.')
    },
  })

  const handleNext = () => {
    saveMutation.mutate()
  }

  const hasAndroid = wizard.selectedPlatforms.includes('android')
  const desktopOnly = !hasAndroid && wizard.selectedPlatforms.includes('desktop')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">App Features</h2>
        <p className="text-sm text-gray-600">All <span className="font-semibold text-gray-900">50+ premium features</span> are included with the paid plan. Toggle the ones you need.</p>
      </div>

      {hasAndroid && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES.map(({ key, label, description, icon: Icon, helpUrl }) => {
          const enabled = features[key] ?? false
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleFeature(key)}
              className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors ${
                enabled
                  ? 'border-primary-600 bg-primary-50/60'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-md shrink-0 ${
                  enabled ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">{label}</span>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors flex items-center shrink-0 ${
                      enabled ? 'bg-primary-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{description}</p>
                {helpUrl && (
                  <a
                    href={helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mt-1.5 font-medium"
                  >
                    Learn more <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </button>
          )
        })}
      </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => wizard.setStep(1)}
          className="flex items-center gap-2 text-gray-600 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ========== STEP 3 - ADVANCED ==========

function Step3Advanced() {
  const wizard = useWizardStore()

  const [firebaseServerKey, setFirebaseServerKey] = useState(wizard.firebaseConfig?.server_key || '')
  const [firebaseServicesJson, setFirebaseServicesJson] = useState(wizard.firebaseConfig?.google_services_json || '')

  const [admobAppId, setAdmobAppId] = useState(wizard.admobConfig?.app_id || '')
  const [admobBannerId, setAdmobBannerId] = useState(wizard.admobConfig?.banner_id || '')
  const [admobInterstitialId, setAdmobInterstitialId] = useState(wizard.admobConfig?.interstitial_id || '')
  const [admobRewardedId, setAdmobRewardedId] = useState(wizard.admobConfig?.rewarded_id || '')

  const [customUA, setCustomUA] = useState(wizard.customUserAgent)
  const showNavBuilder = wizard.features.navigation_menu
  const [navType, setNavType] = useState(
    wizard.navigationType === 'none' && showNavBuilder ? 'bottom_nav' : wizard.navigationType
  )
  const [navItems, setNavItems] = useState<NavigationItem[]>(wizard.navigationItems)

  const [customKeystoreFile, setCustomKeystoreFile] = useState<File | null>(wizard.customKeystoreFile)
  const [customKeystoreUrl, setCustomKeystoreUrl] = useState<string | null>(wizard.customKeystoreUrl)
  const [customKeystorePassword, setCustomKeystorePassword] = useState(wizard.customKeystorePassword)
  const [customKeystoreAlias, setCustomKeystoreAlias] = useState(wizard.customKeystoreAlias)
  const [customKeystorePrivatePassword, setCustomKeystorePrivatePassword] = useState(wizard.customKeystorePrivatePassword)
  const [showKeystorePass, setShowKeystorePass] = useState(false)
  const [showKeyPass, setShowKeyPass] = useState(false)

  const onKeystoreDrop = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (file) {
        setCustomKeystoreFile(file)
      }
    },
    [],
  )

  const addNavItem = () => {
    setNavItems([...navItems, { label: '', url: '' }])
  }

  const removeNavItem = (index: number) => {
    setNavItems(navItems.filter((_, i) => i !== index))
  }

  const updateNavItem = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...navItems]
    updated[index] = { ...updated[index], [field]: value }
    setNavItems(updated)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!wizard.appId) throw new Error('No app ID')

      const firebaseConfig =
        firebaseServerKey || firebaseServicesJson
          ? { server_key: firebaseServerKey || undefined, google_services_json: firebaseServicesJson || undefined }
          : undefined

      const admobConfig =
        admobAppId || admobBannerId || admobInterstitialId || admobRewardedId
          ? {
              app_id: admobAppId || undefined,
              banner_id: admobBannerId || undefined,
              interstitial_id: admobInterstitialId || undefined,
              rewarded_id: admobRewardedId || undefined,
            }
          : undefined

      let uploadedUrl = customKeystoreUrl
      if (customKeystoreFile) {
        const res = await appsApi.uploadKeystore(wizard.appId, customKeystoreFile)
        uploadedUrl = res.data.custom_keystore_url || null
      }

      return appsApi.update(wizard.appId, {
        firebase_config: firebaseConfig,
        admob_config: admobConfig,
        desktop_config: wizard.selectedPlatforms.includes('desktop') ? wizard.desktopConfig : undefined,
        custom_user_agent: customUA || undefined,
        navigation_type: navType,
        navigation_items: navItems.filter((item) => item.label && item.url),
        custom_keystore_url: uploadedUrl || undefined,
        custom_keystore_password: customKeystorePassword || undefined,
        custom_keystore_alias: customKeystoreAlias || undefined,
        custom_keystore_private_password: customKeystorePrivatePassword || undefined,
      })
    },
    onSuccess: (res) => {
      wizard.setAdvanced({
        firebaseConfig: { server_key: firebaseServerKey, google_services_json: firebaseServicesJson },
        admobConfig: { app_id: admobAppId, banner_id: admobBannerId, interstitial_id: admobInterstitialId, rewarded_id: admobRewardedId },
        customUserAgent: customUA,
        customKeystoreFile: customKeystoreFile,
        customKeystoreUrl: res.data.custom_keystore_url || null,
        customKeystorePassword: customKeystorePassword,
        customKeystoreAlias: customKeystoreAlias,
        customKeystorePrivatePassword: customKeystorePrivatePassword,
      })
      wizard.setNavigation(navType, navItems.filter((item) => item.label && item.url))
      wizard.setStep(4)
    },
    onError: () => {
      toast.error('Failed to save advanced settings.')
    },
  })

  const inputClass = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const hasAndroid = wizard.selectedPlatforms.includes('android')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Advanced Settings</h2>
        <p className="text-sm text-gray-500">Configure integrations and advanced options.</p>
      </div>

      {/* Firebase — Android only */}
      {hasAndroid && (
      <CollapsibleSection
        title="Firebase Configuration"
        helpUrl="https://firebase.google.com/docs/android/setup"
        helpLabel="How to create a Firebase project & get google-services.json"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Server Key</label>
          <input
            className={inputClass}
            value={firebaseServerKey}
            onChange={(e) => setFirebaseServerKey(e.target.value)}
            placeholder="Enter Firebase Server Key"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">google-services.json</label>
          <textarea
            className={`${inputClass} resize-none font-mono text-xs`}
            rows={6}
            value={firebaseServicesJson}
            onChange={(e) => setFirebaseServicesJson(e.target.value)}
            placeholder="Paste contents of google-services.json"
          />
        </div>
      </CollapsibleSection>
      )}

      {/* AdMob — Android only */}
      {hasAndroid && (
      <CollapsibleSection
        title="AdMob Configuration"
        helpUrl="https://support.google.com/admob/answer/7356431"
        helpLabel="How to create an AdMob account & get Ad Unit IDs"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
          <input className={inputClass} value={admobAppId} onChange={(e) => setAdmobAppId(e.target.value)} placeholder="ca-app-pub-xxxxx~xxxxx" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banner Ad ID</label>
          <input className={inputClass} value={admobBannerId} onChange={(e) => setAdmobBannerId(e.target.value)} placeholder="ca-app-pub-xxxxx/xxxxx" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interstitial Ad ID</label>
          <input className={inputClass} value={admobInterstitialId} onChange={(e) => setAdmobInterstitialId(e.target.value)} placeholder="ca-app-pub-xxxxx/xxxxx" />
        </div>
      </CollapsibleSection>
      )}

      {/* Custom Keystore — Android only */}
      {hasAndroid && (
      <CollapsibleSection
        title="Custom Keystore Signing (Optional)"
        helpUrl="https://developer.android.com/studio/publish/app-signing"
        helpLabel="How to generate a keystore and upload it"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            If you already have this app live on Google Play, upload your existing signing keystore here. 
            This ensures your new build can be uploaded as an update. If left empty, WebToApp will automatically generate a secure signing key for you.
          </p>
          
          <KeystoreDropzone
            label="Upload Keystore File (.jks / .keystore)"
            fileName={customKeystoreFile ? customKeystoreFile.name : (customKeystoreUrl ? "keystore.jks (already uploaded)" : null)}
            onDrop={onKeystoreDrop}
            hint="Must be a valid .jks or .keystore file"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keystore Password</label>
              <div className="relative">
                <input
                  type={showKeystorePass ? "text" : "password"}
                  className={inputClass}
                  value={customKeystorePassword}
                  onChange={(e) => setCustomKeystorePassword(e.target.value)}
                  placeholder="Enter Keystore Password"
                />
                <button
                  type="button"
                  onClick={() => setShowKeystorePass(!showKeystorePass)}
                  className="absolute right-3 top-2.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  {showKeystorePass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Alias</label>
              <input
                className={inputClass}
                value={customKeystoreAlias}
                onChange={(e) => setCustomKeystoreAlias(e.target.value)}
                placeholder="Enter Key Alias"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Private Key Password <span className="text-xs text-gray-400 font-normal">(Optional — defaults to keystore password if blank)</span>
            </label>
            <div className="relative">
              <input
                type={showKeyPass ? "text" : "password"}
                className={inputClass}
                value={customKeystorePrivatePassword}
                onChange={(e) => setCustomKeystorePrivatePassword(e.target.value)}
                placeholder="Enter Key Password"
              />
              <button
                type="button"
                onClick={() => setShowKeyPass(!showKeyPass)}
                className="absolute right-3 top-2.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                {showKeyPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSection>
      )}

      {/* Custom User Agent */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Custom User Agent</label>
        <input
          className={inputClass}
          value={customUA}
          onChange={(e) => setCustomUA(e.target.value)}
          placeholder="Leave empty for default"
        />
      </div>

      {/* Navigation Menu Builder */}
      {showNavBuilder && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Navigation Menu Builder</h3>
              <p className="text-xs text-gray-500">Add menu items with labels and URLs</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={navType}
                onChange={(e) => setNavType(e.target.value as 'none' | 'bottom_nav' | 'drawer')}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bottom_nav">Bottom Navigation</option>
                <option value="drawer">Drawer Menu</option>
              </select>
            </div>
          </div>

          {navItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={item.label}
                onChange={(e) => updateNavItem(idx, 'label', e.target.value)}
                placeholder="Label"
              />
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={item.url}
                onChange={(e) => updateNavItem(idx, 'url', e.target.value)}
                placeholder="https://example.com/page"
              />
              <button
                type="button"
                onClick={() => removeNavItem(idx)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addNavItem}
            className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      )}

      {/* Desktop Settings */}
      {wizard.selectedPlatforms.includes('desktop') && (
        <CollapsibleSection title="Desktop Settings" defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Window Width</label>
              <input
                type="number"
                className={inputClass}
                value={wizard.desktopConfig.window_width}
                onChange={(e) => wizard.setDesktopConfig({ window_width: parseInt(e.target.value) || 1280 })}
                min={400}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Window Height</label>
              <input
                type="number"
                className={inputClass}
                value={wizard.desktopConfig.window_height}
                onChange={(e) => wizard.setDesktopConfig({ window_height: parseInt(e.target.value) || 800 })}
                min={300}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Width</label>
              <input
                type="number"
                className={inputClass}
                value={wizard.desktopConfig.min_width}
                onChange={(e) => wizard.setDesktopConfig({ min_width: parseInt(e.target.value) || 800 })}
                min={200}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Height</label>
              <input
                type="number"
                className={inputClass}
                value={wizard.desktopConfig.min_height}
                onChange={(e) => wizard.setDesktopConfig({ min_height: parseInt(e.target.value) || 600 })}
                min={200}
              />
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {([
              { key: 'show_title_bar', label: 'Show Title Bar', desc: 'Display the native window title bar' },
              { key: 'show_menu_bar', label: 'Show Menu Bar', desc: 'Display the application menu bar' },
              { key: 'enable_system_tray', label: 'System Tray', desc: 'Minimize to system tray on close' },
              { key: 'start_maximized', label: 'Start Maximized', desc: 'Open the window maximized' },
              { key: 'start_fullscreen', label: 'Start Fullscreen', desc: 'Open the window in fullscreen' },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => wizard.setDesktopConfig({ [key]: !wizard.desktopConfig[key] })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                    wizard.desktopConfig[key] ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => wizard.setStep(2)}
          className="flex items-center gap-2 text-gray-600 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ========== STEP 4 - PLAN & REVIEW ==========

function Step4PlanReview() {
  const wizard = useWizardStore()
  const navigate = useNavigate()

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list().then((r) => r.data),
  })

  const { data: paymentMode } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: () => paymentsApi.getPaymentMode().then((r) => r.data),
  })

  const [selectedPlan, setSelectedPlan] = useState<string | null>(wizard.selectedPlanId)
  const [showPublishServiceModal, setShowPublishServiceModal] = useState(false)
  const [publishServiceSuccess, setPublishServiceSuccess] = useState(false)
  const [publishServiceLoading, setPublishServiceLoading] = useState(false)
  const [publishForm, setPublishForm] = useState({ name: '', email: '', appName: '', websiteUrl: '', notes: '' })

  // Default to paid plan once plans load (if none chosen yet).
  useEffect(() => {
    if (selectedPlan || !plans) return
    const platformPlans = (plans as Plan[]).filter((p) => wizard.selectedPlatforms.includes(p.platform as any))
    const paid = platformPlans.find((p) => p.price_inr > 0)
    if (paid) {
      setSelectedPlan(paid.id)
      wizard.setPlan(paid.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans])
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount_percent: number; discounted_price_usd: number } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  const currency = getUserCurrency()

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    const plan = (plans as Plan[])?.find((p) => p.id === selectedPlan)
    const priceUsd = plan?.price_usd ?? 0
    setPromoLoading(true)
    setPromoError('')
    setPromoApplied(null)
    try {
      const res = await fetch(`/api/promo/${promoCode.trim()}?plan_price_usd=${priceUsd}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid code')
      setPromoApplied(data)
    } catch (e: any) {
      setPromoError(e.message || 'Invalid promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  const createOrder = useMutation({
    mutationFn: async (): Promise<{ data: any; plan: Plan | undefined }> => {
      if (!wizard.appId || !selectedPlan) throw new Error('Missing data')
      const plan = (plans as Plan[])?.find((p) => p.id === selectedPlan)

      const userCurrency = getUserCurrency()
      const res = await ordersApi.create({
        app_config_id: wizard.appId,
        plan_id: selectedPlan,
        currency: userCurrency,
        promo_code: promoApplied?.code || undefined,
      })
      return { data: res.data, plan }
    },
    onSuccess: async (result) => {
      const { data: order, plan } = result

      // Free plan — auto-trigger build immediately so user sees it in Build Status
      if (plan && plan.price_inr === 0 && plan.price_usd === 0) {
        trackFreeAppBuild(wizard.name || 'App')
        // Determine platform from wizard selection
        const platform = wizard.selectedPlatforms?.includes('desktop') && !wizard.selectedPlatforms?.includes('android')
          ? 'desktop'
          : 'android'
        try {
          await buildsApi.trigger(order.id, platform)
          toast.success('Build started! Check Build Status for progress.')
        } catch {
          toast.success('Order created! Click "Build Android" to start your build.')
        }
        navigate(`/orders/${order.id}`)
        return
      }

      // Track begin_checkout event
      const priceUsd = order.currency === 'USD' ? order.amount / 100 : order.amount / 100
      trackBeginCheckout(priceUsd, order.currency)

      // Prefer Razorpay if configured (supports INR and USD); fall back to Stripe.
      if (paymentMode?.gateways?.razorpay) {
        try {
          // Call payment proxy instead of backend (routes through stark-enterprises-two.vercel.app)
          const rpRes = await createRazorpayOrder({
            amount: order.amount,
            currency: order.currency,
            receipt: order.order_number,
            test_mode: paymentMode?.test_mode
          })
          // Add order_id to response for handleRazorpay
          handleRazorpay({
            ...rpRes,
            order_id: order.id
          }, order.id)
        } catch {
          toast.error('Razorpay payment initialization failed.')
        }
      } else if (paymentMode?.gateways?.stripe) {
        try {
          const stripeRes = await paymentsApi.createStripeCheckout(order.id)
          // Store order info for conversion tracking on success page
          sessionStorage.setItem('pending_conversion', JSON.stringify({
            value: order.amount / 100,
            currency: order.currency,
            orderId: order.id,
          }))
          window.location.href = stripeRes.data.checkout_url
        } catch {
          toast.error('Stripe payment initialization failed.')
        }
      } else {
        toast.error('No payment gateway configured. Contact support.')
      }
    },
    onError: () => {
      toast.error('Failed to create order.')
    },
  })

  const handleRazorpay = (
    data: { razorpay_order_id: string; razorpay_key_id: string; amount: number; currency: string; order_id: string },
    orderId: string,
  ) => {
    const options = {
      key: data.razorpay_key_id,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpay_order_id,
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          // Notify backend to verify signature and update order status
          await paymentsApi.verifyRazorpay({
            order_id: data.order_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          trackPurchase(data.amount / 100, data.currency, data.order_id)
          toast.success('Payment successful!')
          navigate(`/orders/${orderId}`)
        } catch {
          toast.error('Payment verification failed. Please contact support.')
        }
      },
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  const currentPlan = (plans as Plan[])?.find((p) => p.id === selectedPlan)

  const enabledFeatures = FEATURES.filter((f) => wizard.features[f.key])

  // Map wizard feature keys to plan feature keys (only features that are plan-gated)
  const PLAN_GATED_FEATURES: Record<string, string> = {
    push_notifications: 'push_notifications',
    admob: 'admob',
    biometric_auth: 'biometric_auth',
    deep_linking: 'deep_linking',
    offline_mode: 'offline_mode',
    navigation_menu: 'navigation_menu',
    qr_scanner: 'qr_scanner',
    js_bridge: 'js_bridge',
    screenshot_prevention: 'screenshot_prevention',
    file_upload: 'file_upload',
    location_services: 'location_services',
    camera_access: 'camera_access',
    onboarding_screen: 'onboarding_screen',
    app_shortcut: 'app_shortcut',
    secondary_navigation: 'secondary_navigation',
    social_login: 'social_login',
    in_app_update: 'in_app_update',
    background_location: 'background_location',
    facebook_app_events: 'facebook_app_events',
    in_app_purchases: 'in_app_purchases',
    in_app_review: 'in_app_review',
    background_service: 'background_service',
    native_contacts: 'native_contacts',
    appsflyer: 'appsflyer',
    custom_media_player: 'custom_media_player',
    offer_card: 'offer_card',
    intercom: 'intercom',
    dynamic_app_icon: 'dynamic_app_icon',
    bluetooth_connectivity: 'bluetooth_connectivity',
    download_file_manager: 'download_file_manager',
    floating_action_menu: 'floating_action_menu',
    revenue_cat: 'revenue_cat',
    native_datastore: 'native_datastore',
    passcode_lock: 'passcode_lock',
    app_auto_launch: 'app_auto_launch',
    advanced_bottom_navigation: 'advanced_bottom_navigation',
    firebase_notification: 'firebase_notification',
    tap_to_pay: 'tap_to_pay',
  }

  // Get plan-gated features that the user enabled
  const selectedGatedFeatures = enabledFeatures
    .filter((f) => f.key in PLAN_GATED_FEATURES)
    .map((f) => ({ wizardKey: f.key, planKey: PLAN_GATED_FEATURES[f.key], label: f.label }))

  // Check which features a plan is missing
  const getMissingFeatures = (plan: Plan) =>
    selectedGatedFeatures.filter((f) => !plan.features[f.planKey])

  // Find the minimum plan that covers all selected features
  const getMinimumPlan = (planList: Plan[]) => {
    const sorted = [...planList].sort((a, b) => a.sort_order - b.sort_order)
    return sorted.find((p) => getMissingFeatures(p).length === 0) || sorted[sorted.length - 1]
  }

  const minimumPlan = plans ? getMinimumPlan(plans as Plan[]) : null

  return (
    <div className="space-y-8">
      {/* Test Mode Banner */}
      {paymentMode?.test_mode && (
        <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <FlaskConical className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Test Mode Active</p>
            <p className="text-xs text-amber-600">Using test gateway credentials. No real charges. Use test card numbers to complete payment.</p>
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose a Plan</h2>
        <p className="text-sm text-gray-500 mb-4">Select a plan that fits your needs.</p>

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(plans as Plan[])?.filter((p) => wizard.selectedPlatforms.includes(p.platform as any) && p.slug !== 'play-store-listing').map((plan) => {
              const isSelected = selectedPlan === plan.id
              const isMinimum = minimumPlan?.id === plan.id && selectedGatedFeatures.length > 0
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlan(plan.id)
                    wizard.setPlan(plan.id)
                  }}
                  className={`relative flex flex-col rounded-xl border-2 p-5 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isMinimum && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                      Best Match
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900">
                    {plan.price_inr === 0 ? 'Free Plan' : 'Premium Plan'}
                  </h3>
                  <div className="mt-2">
                    {plan.price_inr === 0 ? (
                      <span className="text-2xl font-bold text-gray-900">Free</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPlanPrice(plan.price_inr, plan.price_usd)}
                        </span>
                        <span className="text-sm font-semibold text-green-700 ml-1">one-time</span>
                      </>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mt-3">{plan.description}</p>
                  )}
                  {plan.price_inr === 0 ? (
                    <p className="mt-3 text-sm font-bold text-amber-600">⏱ 3-day free trial</p>
                  ) : (
                    <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />No watermark, no trial limit
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />Keystore download
                      </li>
                      <li className="flex items-center gap-2 font-bold text-gray-900">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />All 50+ premium features
                      </li>
                    </ul>
                  )}
                </button>
              )
            })}

            {/* Publish App on Play Store — service card (Android only) */}
            {wizard.selectedPlatforms.includes('android') && (
              <button
                type="button"
                onClick={() => {
                  setPublishForm({ name: '', email: '', appName: '', websiteUrl: '', notes: '' })
                  setPublishServiceSuccess(false)
                  setShowPublishServiceModal(true)
                }}
                className="relative flex flex-col rounded-xl border-2 border-indigo-300 bg-indigo-50 hover:border-indigo-500 hover:bg-indigo-100 p-5 text-left transition-all"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                  Add-on Service
                </span>
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-900">Publish App on Play Store</h3>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-indigo-700">$10</span>
                  <span className="text-sm font-semibold text-indigo-500 ml-1">one-time</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Already have an app? We'll publish it for you.</p>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0" />Play Store listing &amp; submission
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0" />AAB upload &amp; release
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0" />Team contacts you in 24 hrs
                  </li>
                </ul>
                <span className="mt-4 w-full text-center py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold">
                  Request Publishing →
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Summary</h2>
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <span className="text-gray-500">App Name</span>
              <p className="font-medium text-gray-900">{wizard.name}</p>
            </div>
            <div>
              <span className="text-gray-500">URL</span>
              <p className="font-medium text-gray-900 truncate">{wizard.url}</p>
            </div>
            <div>
              <span className="text-gray-500">Platforms</span>
              <div className="flex gap-1.5 mt-0.5">
                {wizard.selectedPlatforms.map((p) => (
                  <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Plan</span>
              <p className="font-medium text-gray-900">{currentPlan?.name || 'Not selected'}</p>
            </div>
          </div>

          <div>
            <span className="text-sm text-gray-500">Colors</span>
            <div className="flex gap-3 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border" style={{ backgroundColor: wizard.primaryColor }} />
                <span className="text-xs font-mono">{wizard.primaryColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border" style={{ backgroundColor: wizard.secondaryColor }} />
                <span className="text-xs font-mono">{wizard.secondaryColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border" style={{ backgroundColor: wizard.statusBarColor }} />
                <span className="text-xs font-mono">{wizard.statusBarColor}</span>
              </div>
            </div>
          </div>

          {enabledFeatures.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">Enabled Features ({enabledFeatures.length})</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {enabledFeatures.map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-md"
                  >
                    <Check className="w-3 h-3 text-green-600" />
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {wizard.navigationItems.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">Navigation Items</span>
              <p className="text-sm text-gray-900">{wizard.navigationItems.map((i) => i.label).join(', ')}</p>
            </div>
          )}

          {wizard.selectedPlatforms.includes('desktop') && (
            <div>
              <span className="text-sm text-gray-500">Desktop Settings</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1 text-sm">
                <span className="text-gray-600">Window: {wizard.desktopConfig.window_width}x{wizard.desktopConfig.window_height}</span>
                <span className="text-gray-600">Min: {wizard.desktopConfig.min_width}x{wizard.desktopConfig.min_height}</span>
                {wizard.desktopConfig.show_title_bar && <span className="text-gray-600">Title Bar</span>}
                {wizard.desktopConfig.show_menu_bar && <span className="text-gray-600">Menu Bar</span>}
                {wizard.desktopConfig.enable_system_tray && <span className="text-gray-600">System Tray</span>}
                {wizard.desktopConfig.start_maximized && <span className="text-gray-600">Start Maximized</span>}
                {wizard.desktopConfig.start_fullscreen && <span className="text-gray-600">Start Fullscreen</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promo Code */}
      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Have a promo code?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(null); setPromoError('') }}
            placeholder="Enter code (e.g. FOUNDER9)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!!promoApplied}
          />
          <button
            type="button"
            onClick={promoApplied ? () => { setPromoApplied(null); setPromoCode('') } : handleApplyPromo}
            disabled={promoLoading || (!promoCode.trim() && !promoApplied)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {promoLoading ? '...' : promoApplied ? 'Remove' : 'Apply'}
          </button>
        </div>
        {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
        {promoApplied && (
          <p className="text-green-600 text-xs mt-1 font-medium">
            ✅ {promoApplied.discount_percent}% off applied! New price: ${(promoApplied.discounted_price_usd / 100).toFixed(2)}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="relative flex items-center justify-center pt-4">
        <button
          type="button"
          onClick={() => wizard.setStep(3)}
          className="absolute left-0 flex items-center gap-2 text-gray-600 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => createOrder.mutate()}
          disabled={!selectedPlan || createOrder.isPending}
          className={`flex items-center gap-2 text-white px-8 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors ${
            currentPlan?.price_inr === 0
              ? 'bg-primary-600 hover:bg-primary-700'
              : paymentMode?.test_mode
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {createOrder.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : currentPlan?.price_inr === 0 ? (
            <>
              <Smartphone className="w-4 h-4" /> Build Free APK
            </>
          ) : paymentMode?.test_mode ? (
            <>
              <FlaskConical className="w-4 h-4" /> Submit (Test Mode)
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" /> Submit & Pay
            </>
          )}
        </button>
      </div>

      {/* Publish App on Play Store service modal */}
      {showPublishServiceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && !publishServiceSuccess && setShowPublishServiceModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            {!publishServiceSuccess && (
              <button onClick={() => setShowPublishServiceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}

            {publishServiceSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 text-sm mb-4">Our team will contact you within 24 hours at <strong>{publishForm.email}</strong>.</p>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">📋 Next Step — Action Required:</p>
                  <p className="text-sm text-indigo-700">Add our email to your Google Play Console with <strong>Release Manager</strong> permissions:</p>
                  <p className="text-sm font-bold text-indigo-900 mt-2 bg-white rounded-lg px-3 py-2 border border-indigo-200">support@websitetoapp.app</p>
                  <p className="text-xs text-indigo-600 mt-2">Play Console → Users and permissions → Invite new users → Enter our email → Release Manager.</p>
                </div>
                <button onClick={() => setShowPublishServiceModal(false)} className="mt-4 w-full py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-indigo-100 rounded-xl"><Store className="w-6 h-6 text-indigo-600" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Publish App on Play Store</h3>
                    <p className="text-sm text-indigo-600 font-semibold">$10 one-time</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={publishForm.name} onChange={(e) => setPublishForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input type="email" value={publishForm.email} onChange={(e) => setPublishForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Name *</label>
                    <input type="text" value={publishForm.appName} onChange={(e) => setPublishForm(f => ({ ...f, appName: e.target.value }))} placeholder="e.g. My Store App" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website / App URL</label>
                    <input type="url" value={publishForm.websiteUrl} onChange={(e) => setPublishForm(f => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://yoursite.com" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea value={publishForm.notes} onChange={(e) => setPublishForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special requirements..." rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                </div>
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">📌 Note:</p>
                  <p>Our team will contact you shortly. You'll need to add <strong>support@websitetoapp.app</strong> to your Play Console with <strong>Release Manager</strong> permissions.</p>
                </div>
                <button
                  onClick={async () => {
                    if (!publishForm.name || !publishForm.email || !publishForm.appName) return
                    setPublishServiceLoading(true)
                    try {
                      const order = await createRazorpayOrder({ amount: 1000, currency: 'USD', receipt: `publish_${Date.now()}`, notes: { name: publishForm.name, email: publishForm.email, appName: publishForm.appName, websiteUrl: publishForm.websiteUrl, notes: publishForm.notes, service: 'play-store-publish' } })
                      const options = {
                        key: order.razorpay_key_id, amount: order.amount, currency: order.currency,
                        name: 'WebToApp', description: 'Publish App on Google Play Store',
                        order_id: order.razorpay_order_id,
                        handler: async (response: any) => {
                          try {
                            await verifyRazorpayPayment({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature })
                            setPublishServiceSuccess(true)
                          } catch { alert('Payment verification failed. Contact support@websitetoapp.app') }
                        },
                        prefill: { name: publishForm.name, email: publishForm.email },
                        theme: { color: '#4f46e5' },
                      }
                      new (window as any).Razorpay(options).open()
                    } catch { alert('Failed to initiate payment. Please try again.') }
                    finally { setPublishServiceLoading(false) }
                  }}
                  disabled={publishServiceLoading || !publishForm.name || !publishForm.email || !publishForm.appName}
                  className="mt-4 w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {publishServiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Store className="w-4 h-4" /> Pay $10 &amp; Submit Request</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
