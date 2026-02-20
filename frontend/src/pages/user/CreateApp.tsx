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
} from 'lucide-react'
import { useWizardStore, type Platform } from '@/store/wizardStore'
import { appsApi } from '@/api/apps'
import { ordersApi, paymentsApi, plansApi } from '@/api/orders'
import type { Plan, NavigationItem } from '@/types'
import { formatCurrency } from '@/utils/format'

// ---------- Platform options ----------

const PLATFORM_OPTIONS: { value: Platform | 'both'; label: string; description: string }[] = [
  { value: 'android', label: 'Android', description: 'APK & AAB for Google Play' },
  { value: 'ios', label: 'iOS', description: 'IPA for App Store' },
  { value: 'both', label: 'Both', description: 'Android + iOS builds' },
]

// ---------- Step 0: Basic Info ----------

const basicInfoSchema = z.object({
  name: z.string().min(1, 'App name is required').max(100),
  url: z.string().url('Please enter a valid URL'),
  package_name: z.string().optional(),
  bundle_id: z.string().optional(),
  team_id: z.string().optional(),
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
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
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
      {open && <div className="p-5 space-y-4">{children}</div>}
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
  const [platformSelection, setPlatformSelection] = useState<'android' | 'ios' | 'both'>(
    wizard.selectedPlatforms.length === 2
      ? 'both'
      : wizard.selectedPlatforms[0] || 'android'
  )

  const showAndroid = platformSelection === 'android' || platformSelection === 'both'
  const showIos = platformSelection === 'ios' || platformSelection === 'both'

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
      bundle_id: wizard.bundleId,
      team_id: wizard.teamId,
      description: wizard.description,
    },
  })

  const handlePlatformChange = (value: 'android' | 'ios' | 'both') => {
    setPlatformSelection(value)
    if (value === 'both') {
      wizard.setSelectedPlatforms(['android', 'ios'])
    } else {
      wizard.setSelectedPlatforms([value])
    }
  }

  const createApp = useMutation({
    mutationFn: (data: BasicInfoData) =>
      appsApi.create({
        name: data.name,
        url: data.url,
        package_name: showAndroid ? data.package_name || undefined : undefined,
        bundle_id: showIos ? data.bundle_id || undefined : undefined,
        team_id: showIos ? data.team_id || undefined : undefined,
        description: data.description || undefined,
      }),
    onSuccess: (res) => {
      wizard.setAppId(res.data.id)
      wizard.setBasicInfo({
        name: res.data.name,
        url: res.data.url,
        packageName: res.data.package_name || '',
        bundleId: res.data.bundle_id || '',
        teamId: res.data.team_id || '',
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
        package_name: showAndroid ? data.package_name || undefined : undefined,
        bundle_id: showIos ? data.bundle_id || undefined : undefined,
        team_id: showIos ? data.team_id || undefined : undefined,
        description: data.description || undefined,
      }),
    onSuccess: (res) => {
      wizard.setBasicInfo({
        name: res.data.name,
        url: res.data.url,
        packageName: res.data.package_name || '',
        bundleId: res.data.bundle_id || '',
        teamId: res.data.team_id || '',
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Platform Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target Platform *</label>
        <div className="grid grid-cols-3 gap-3">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePlatformChange(opt.value)}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                platformSelection === opt.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Smartphone className={`w-6 h-6 mb-1.5 ${platformSelection === opt.value ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${platformSelection === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                {opt.label}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{opt.description}</span>
            </button>
          ))}
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

      {/* Android-specific: Package Name */}
      {showAndroid && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Name (Android)</label>
          <input
            {...register('package_name')}
            className={inputClass}
            placeholder="com.example.myapp (auto-generated if empty)"
          />
        </div>
      )}

      {/* iOS-specific: Bundle ID + Team ID */}
      {showIos && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bundle ID (iOS)</label>
            <input
              {...register('bundle_id')}
              className={inputClass}
              placeholder="com.example.myapp (auto-generated if empty)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team ID (iOS)</label>
            <input
              {...register('team_id')}
              className={inputClass}
              placeholder="Apple Developer Team ID"
            />
            <p className="text-xs text-gray-400 mt-1">Found in your Apple Developer account under Membership.</p>
          </div>
        </>
      )}

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
  const [navType, setNavType] = useState(wizard.navigationType)
  const [navItems, setNavItems] = useState<NavigationItem[]>(wizard.navigationItems)

  const showNavBuilder = wizard.features.navigation_menu

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
      <CollapsibleSection title="Firebase Configuration">
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
      <CollapsibleSection title="AdMob Configuration">
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

  return (
    <div className="space-y-8">
      {/* Plan Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose a Plan</h2>
        <p className="text-sm text-gray-500 mb-6">Select a plan that fits your needs.</p>

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(plans as Plan[])?.map((plan) => {
              const isSelected = selectedPlan === plan.id
              const isRecommended = plan.sort_order === 2
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
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(plan.price_inr, 'INR')}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      / {formatCurrency(plan.price_usd, 'USD')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{plan.billing_type.replace('_', ' ')}</p>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mt-3">{plan.description}</p>
                  )}
                  <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Up to {plan.max_apps} app{plan.max_apps !== 1 ? 's' : ''}
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
            {wizard.selectedPlatforms.includes('android') && (
              <div>
                <span className="text-gray-500">Package Name</span>
                <p className="font-medium text-gray-900">{wizard.packageName || 'Auto-generated'}</p>
              </div>
            )}
            {wizard.selectedPlatforms.includes('ios') && (
              <>
                <div>
                  <span className="text-gray-500">Bundle ID</span>
                  <p className="font-medium text-gray-900">{wizard.bundleId || 'Auto-generated'}</p>
                </div>
                {wizard.teamId && (
                  <div>
                    <span className="text-gray-500">Team ID</span>
                    <p className="font-medium text-gray-900">{wizard.teamId}</p>
                  </div>
                )}
              </>
            )}
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
