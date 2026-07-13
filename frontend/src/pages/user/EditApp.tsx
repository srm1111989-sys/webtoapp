import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertCircle } from 'lucide-react'
import { appsApi } from '@/api/apps'
import { ordersApi } from '@/api/orders'
import { useWizardStore } from '@/store/wizardStore'
import CreateApp from './CreateApp'

export default function EditApp() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const wizard = useWizardStore()
  const [wizardReady, setWizardReady] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['app', id],
    queryFn: () => appsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders-all'],
    queryFn: () => ordersApi.list(1, 100).then((r) => r.data),
    enabled: !!id,
  })

  useEffect(() => {
    // Wait for both queries to finish before populating wizard
    if (!data || ordersLoading) return

    const appOrders = (ordersData?.orders ?? [])
      .filter((o) => o.app_config_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const existingOrder =
      appOrders.find((o) => o.status === 'paid') ?? appOrders[0] ?? null

    wizard.reset()
    wizard.setAppId(data.id)
    wizard.setExistingOrderId(existingOrder?.id ?? null)
    wizard.setSelectedPlatforms((data.selected_platforms ?? ['android']) as any)
    wizard.setBasicInfo({
      name: data.name,
      url: data.url,
      packageName: data.package_name ?? '',
      versionCode: data.version_code ?? null,
      description: data.description ?? '',
    })
    wizard.setVisuals({
      primaryColor: data.primary_color ?? '#2563EB',
      secondaryColor: data.secondary_color ?? '#1E40AF',
      statusBarColor: data.status_bar_color ?? '#1E3A5F',
      iconPreview: data.icon_url ?? null,
      splashPreview: data.splash_url ?? null,
    })
    wizard.setFeatures((data.features as Record<string, boolean>) ?? {})
    wizard.setNavigation(
      (data.navigation_type as any) ?? 'none',
      (data.navigation_items as any[]) ?? [],
    )
    wizard.setAdvanced({
      firebaseConfig: (data.firebase_config as any) ?? null,
      admobConfig: (data.admob_config as any) ?? null,
      customUserAgent: data.custom_user_agent ?? '',
      customKeystoreUrl: data.custom_keystore_url ?? null,
      customKeystorePassword: data.custom_keystore_password ?? '',
      customKeystoreAlias: data.custom_keystore_alias ?? '',
      customKeystorePrivatePassword: data.custom_keystore_private_password ?? '',
    })
    if (data.desktop_config) {
      wizard.setDesktopConfig(data.desktop_config as any)
    }

    // Only mount CreateApp after wizard is fully populated
    setWizardReady(true)
  }, [data, ordersData, ordersLoading])

  // Error/not-found must be checked before the wizardReady spinner: on a 404
  // wizardReady never becomes true, so the old order spun forever.
  if (isError || (!isLoading && !data)) {
    return (
      <div className="max-w-lg mx-auto mt-16">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 flex items-start gap-3 text-red-700">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">App not found</p>
            <p className="text-sm mt-1">
              This app doesn't exist or you don't have access to it.{' '}
              <button className="underline" onClick={() => navigate('/apps')}>Go back</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || ordersLoading || !wizardReady) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    )
  }

  return <CreateApp />
}
