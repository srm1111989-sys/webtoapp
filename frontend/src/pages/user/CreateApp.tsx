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
} from 'lucide-react'
import { useWizardStore, type Platform } from '@/store/wizardStore'
import { appsApi } from '@/api/apps'
import { ordersApi, paymentsApi, plansApi } from '@/api/orders'
import type { Plan, NavigationItem } from '@/types'
import { formatCurrency } from '@/utils/format'

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
  { key: 'push_notifications', label: 'Push Notifications', description: 'Send push notifications via Firebase', icon: Bell },
  { key: 'admob', label: 'AdMob Ads', description: 'Monetize with Google AdMob ads', icon: DollarSign },
  { key: 'biometric_auth', label: 'Biometric Auth', description: 'Fingerprint and face unlock', icon: Fingerprint },
  { key: 'deep_linking', label: 'Deep Linking', description: 'Handle deep links and URLs', icon: Link2 },
  { key: 'offline_mode', label: 'Offline Mode', description: 'Cache content for offline access', icon: WifiOff },
  { key: 'navigation_menu', label: 'Navigation Menu', description: 'Bottom nav or drawer menu', icon: Menu },
  { key: 'qr_scanner', label: 'QR Scanner', description: 'Built-in QR code scanner', icon: QrCode },
  { key: 'js_bridge', label: 'JS Bridge', description: 'JavaScript to native bridge', icon: Code2 },
  { key: 'screenshot_prevention', label: 'Screenshot Prevention', description: 'Block screenshots in app', icon: ShieldOff },
  { key: 'file_upload', label: 'File Upload', description: 'Support file uploads from device', icon: Upload },
  { key: 'location_services', label: 'Location Services', description: 'Access device GPS location', icon: MapPin },
  { key: 'camera_access', label: 'Camera Access', description: 'Access device camera', icon: Camera },
] as const

// ---------- Step indicator ----------

const STEP_LABELS = ['Basic Info', 'Visuals', 'Features', 'Advanced', 'Plan & Review']

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEP_LABELS.map((label, idx) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                idx < currentStep
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : idx === currentStep
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              {idx < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
            </div>
            <span
              className={`mt-1.5 text-xs font-medium ${
                idx <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
          {idx < STEP_LABELS.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-2 mb-5 ${
                idx < currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New App</h1>
      <p className="text-gray-500 mb-8">Convert your website into a mobile app in minutes.</p>

      <StepIndicator currentStep={step} />

      <div className="bg-white rounded-2xl shadow-sm border p-8">
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
      }),
    onSuccess: (res) => {
      wizard.setAppId(res.data.id)
      wizard.setBasicInfo({
        name: res.data.name,
        url: res.data.url,
        packageName: res.data.package_name || '',
        description: res.data.description || '',
      })
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
  const inputClass = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  const togglePlatform = (platform: Platform) => {
    const current = wizard.selectedPlatforms
    if (current.includes(platform)) {
      if (current.length > 1) {
        wizard.setSelectedPlatforms(current.filter((p) => p !== platform))
      }
    } else {
      wizard.setSelectedPlatforms([...current, platform])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Platform Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target Platforms *</label>
        <p className="text-xs text-gray-500 mb-3">Select one or both platforms. At least one is required.</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => togglePlatform('android')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              wizard.selectedPlatforms.includes('android')
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${wizard.selectedPlatforms.includes('android') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">Android</span>
              <p className="text-xs text-gray-500">APK & AAB for mobile</p>
            </div>
            {wizard.selectedPlatforms.includes('android') && (
              <Check className="w-5 h-5 text-blue-600 ml-auto" />
            )}
          </button>
          <button
            type="button"
            onClick={() => togglePlatform('desktop')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              wizard.selectedPlatforms.includes('desktop')
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${wizard.selectedPlatforms.includes('desktop') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">Windows Desktop</span>
              <p className="text-xs text-gray-500">EXE installer via Electron</p>
            </div>
            {wizard.selectedPlatforms.includes('desktop') && (
              <Check className="w-5 h-5 text-blue-600 ml-auto" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">App Name *</label>
        <input
          {...register('name')}
          className={inputClass}
          placeholder="My Awesome App"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website URL *</label>
        <div className="relative">
          <Globe className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            {...register('url')}
            className="w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>
        {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
        <input
          {...register('package_name')}
          className={inputClass}
          placeholder="com.example.myapp (auto-generated if empty)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Describe your app..."
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
      if (wizard.splashFile) {
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
            hint="512x512px recommended, PNG or JPG"
          />

          <ImageDropzone
            label="Splash Screen"
            preview={wizard.splashPreview}
            onDrop={onSplashDrop}
            hint="1080x1920px recommended"
          />

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

          <ColorPickerField
            label="Status Bar Color"
            color={wizard.statusBarColor}
            onChange={(c) => wizard.setVisuals({ statusBarColor: c })}
          />
        </div>

        {/* Right: Preview */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Live Preview</h3>
          <PhoneMockup
            primaryColor={wizard.primaryColor}
            secondaryColor={wizard.secondaryColor}
            statusBarColor={wizard.statusBarColor}
            iconPreview={wizard.iconPreview}
            appName={wizard.name}
          />
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">App Features</h2>
        <p className="text-sm text-gray-500">Toggle features for your mobile app.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map(({ key, label, description, icon: Icon }) => {
          const enabled = features[key] ?? false
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleFeature(key)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                enabled
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors flex items-center ${
                      enabled ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
            </button>
          )
        })}
      </div>

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
    mutationFn: () => {
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

      return appsApi.update(wizard.appId, {
        firebase_config: firebaseConfig,
        admob_config: admobConfig,
        desktop_config: wizard.selectedPlatforms.includes('desktop') ? wizard.desktopConfig : undefined,
        custom_user_agent: customUA || undefined,
        navigation_type: navType,
        navigation_items: navItems.filter((item) => item.label && item.url),
      })
    },
    onSuccess: () => {
      wizard.setAdvanced({
        firebaseConfig: { server_key: firebaseServerKey, google_services_json: firebaseServicesJson },
        admobConfig: { app_id: admobAppId, banner_id: admobBannerId, interstitial_id: admobInterstitialId, rewarded_id: admobRewardedId },
        customUserAgent: customUA,
      })
      wizard.setNavigation(navType, navItems.filter((item) => item.label && item.url))
      wizard.setStep(4)
    },
    onError: () => {
      toast.error('Failed to save advanced settings.')
    },
  })

  const inputClass = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Advanced Settings</h2>
        <p className="text-sm text-gray-500">Configure integrations and advanced options.</p>
      </div>

      {/* Firebase */}
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

      {/* AdMob */}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rewarded Ad ID</label>
          <input className={inputClass} value={admobRewardedId} onChange={(e) => setAdmobRewardedId(e.target.value)} placeholder="ca-app-pub-xxxxx/xxxxx" />
        </div>
      </CollapsibleSection>

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
          <div className="grid grid-cols-2 gap-4">
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

  const [selectedPlan, setSelectedPlan] = useState<string | null>(wizard.selectedPlanId)

  const createOrder = useMutation({
    mutationFn: () => {
      if (!wizard.appId || !selectedPlan) throw new Error('Missing data')
      return ordersApi.create({
        app_config_id: wizard.appId,
        plan_id: selectedPlan,
      })
    },
    onSuccess: async (res) => {
      const order = res.data
      const plan = (plans as Plan[])?.find((p) => p.id === selectedPlan)

      // Free plan
      if (plan && plan.price_inr === 0 && plan.price_usd === 0) {
        toast.success('App submitted successfully!')
        navigate(`/orders/${order.id}`)
        return
      }

      // Test mode
      try {
        const testRes = await paymentsApi.testPayment(order.id)
        toast.success(testRes.data.message || 'Test payment successful!')
        navigate(`/orders/${order.id}`)
      } catch {
        // If test mode fails, try Razorpay
        try {
          const rpRes = await paymentsApi.createRazorpay(order.id)
          handleRazorpay(rpRes.data, order.id)
        } catch {
          // Fallback to Stripe
          try {
            const stripeRes = await paymentsApi.createStripeCheckout(order.id)
            window.location.href = stripeRes.data.checkout_url
          } catch {
            toast.error('Payment initialization failed.')
          }
        }
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
          await paymentsApi.verifyRazorpay({
            order_id: data.order_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          toast.success('Payment successful!')
          navigate(`/orders/${orderId}`)
        } catch {
          toast.error('Payment verification failed.')
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
      {/* Plan Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose a Plan</h2>
        <p className="text-sm text-gray-500 mb-4">Select a plan that fits your needs.</p>

        {/* Feature-based recommendation */}
        {selectedGatedFeatures.length > 0 && minimumPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-800">
              Based on your selected features ({selectedGatedFeatures.map((f) => f.label).join(', ')}),
              you need at least the <strong>{minimumPlan.name}</strong> plan.
            </p>
          </div>
        )}

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(plans as Plan[])?.map((plan) => {
              const isSelected = selectedPlan === plan.id
              const missing = getMissingFeatures(plan)
              const hasMissing = missing.length > 0
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
                      : hasMissing
                        ? 'border-gray-200 hover:border-gray-300 opacity-75'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isMinimum && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                      Best Match
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(plan.price_inr, 'INR')}
                    </span>
                    {plan.billing_type === 'monthly' ? (
                      <span className="text-sm font-semibold text-gray-700 ml-1">/month</span>
                    ) : plan.price_inr > 0 ? (
                      <span className="text-sm font-semibold text-green-700 ml-1">one-time</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatCurrency(plan.price_usd, 'USD')}
                    {plan.billing_type === 'monthly' ? '/mo' : plan.price_usd > 0 ? ' one-time' : ''}
                  </p>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mt-3">{plan.description}</p>
                  )}

                  {/* Missing features warning */}
                  {hasMissing && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-2">
                      <div className="flex items-center gap-1 text-amber-700 text-xs font-medium mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Missing features you selected:
                      </div>
                      <ul className="space-y-0.5">
                        {missing.map((f) => (
                          <li key={f.wizardKey} className="flex items-center gap-1 text-xs text-amber-600">
                            <X className="w-3 h-3" /> {f.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Up to {plan.max_apps} app{plan.max_apps !== 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.price_inr === 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-600">WebToApp branding</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          No branding / watermark
                        </>
                      )}
                    </li>
                    {Object.entries(plan.features)
                      .filter(([, v]) => v)
                      .map(([key]) => (
                        <li key={key} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </li>
                      ))}
                  </ul>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Warning: selected plan missing features */}
      {currentPlan && getMissingFeatures(currentPlan).length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              The {currentPlan.name} plan does not include these features you enabled:
            </p>
            <ul className="mt-1 space-y-0.5">
              {getMissingFeatures(currentPlan).map((f) => (
                <li key={f.wizardKey} className="text-sm text-amber-700">- {f.label}</li>
              ))}
            </ul>
            <p className="text-xs text-amber-600 mt-2">
              These features will not work in your app. Upgrade to the {minimumPlan?.name} plan or go back to Step 3 to disable them.
            </p>
          </div>
        </div>
      )}

      {/* Review Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Summary</h2>
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
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
            <div>
              <span className="text-gray-500">Package Name</span>
              <p className="font-medium text-gray-900">{wizard.packageName || 'Auto-generated'}</p>
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
              <span className="text-sm text-gray-500">Enabled Features</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {enabledFeatures.map((f) => (
                  <span key={f.key} className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
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

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => wizard.setStep(3)}
          className="flex items-center gap-2 text-gray-600 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => createOrder.mutate()}
          disabled={!selectedPlan || createOrder.isPending}
          className="flex items-center gap-2 bg-green-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {createOrder.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" /> Submit & Pay
            </>
          )}
        </button>
      </div>
    </div>
  )
}
