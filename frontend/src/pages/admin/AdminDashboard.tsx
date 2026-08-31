import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Users, ShoppingCart, IndianRupee, DollarSign, Loader2, AlertTriangle, Activity, CreditCard, FlaskConical, FolderOpen, Cpu, CheckCircle2, AlertCircle, HardDrive, Clock, GitBranch } from 'lucide-react'

import { Link } from 'react-router-dom'
import { adminApi } from '@/api/admin'
import { projectsApi } from '@/api/projects'
import { formatCurrency, formatDateTime } from '@/utils/format'

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'enhanced-stats'],
    queryFn: () => adminApi.getEnhancedStats().then((r) => r.data),
  })

  const { data: ciQuotaData, isLoading: isLoadingQuota } = useQuery({
    queryKey: ['admin', 'ci-quota'],
    queryFn: () => adminApi.getCiQuota().then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => projectsApi.list().then((r) => r.data),
  })

  const { data: adminSettings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings().then((r) => r.data),
  })

  const testModeEnabled = adminSettings?.payment_test_mode?.toLowerCase() === 'true'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500">Failed to load dashboard data.</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users.toLocaleString(),
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Projects',
      value: (projectsData?.total || 0).toLocaleString(),
      icon: FolderOpen,
      color: 'bg-indigo-50 text-indigo-600',
      link: '/admin/projects',
    },
    {
      label: 'Total Orders',
      value: stats.orders.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Revenue INR',
      value: formatCurrency(stats.revenue_inr, 'INR'),
      icon: IndianRupee,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Revenue USD',
      value: formatCurrency(stats.revenue_usd, 'USD'),
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Active Subscriptions',
      value: stats.active_subscriptions.toLocaleString(),
      icon: CreditCard,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Build Failure Rate',
      value: `${stats.failure_rate}%`,
      icon: Activity,
      color: stats.failure_rate > 30 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600',
    },
  ]

  const buildsChartData = Object.entries(stats.builds).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }))

  // Aggregate daily builds for chart
  const dailyBuildsMap = new Map<string, { date: string; success: number; failed: number; building: number; pending: number }>()
  for (const item of stats.daily_builds) {
    if (!dailyBuildsMap.has(item.date)) {
      dailyBuildsMap.set(item.date, { date: item.date, success: 0, failed: 0, building: 0, pending: 0 })
    }
    const entry = dailyBuildsMap.get(item.date)!
    if (item.status === 'success') entry.success += item.count
    else if (item.status === 'failed') entry.failed += item.count
    else if (item.status === 'building') entry.building += item.count
    else entry.pending += item.count
  }
  const dailyBuildsChart = Array.from(dailyBuildsMap.values())

  // Aggregate daily revenue
  const dailyRevenueMap = new Map<string, { date: string; inr: number; usd: number }>()
  for (const item of stats.daily_revenue) {
    if (!dailyRevenueMap.has(item.date)) {
      dailyRevenueMap.set(item.date, { date: item.date, inr: 0, usd: 0 })
    }
    const entry = dailyRevenueMap.get(item.date)!
    if (item.currency === 'INR') entry.inr += item.total / 100
    else entry.usd += item.total / 100
  }
  const dailyRevenueChart = Array.from(dailyRevenueMap.values())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your platform</p>
      </div>

      {/* Test Mode Banner */}
      {testModeEnabled && (
        <div className="flex items-center justify-between bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Payment Test Mode Active</p>
              <p className="text-xs text-amber-600">All payments are simulated. Disable in Settings before going live.</p>
            </div>
          </div>
          <Link
            to="/admin/settings"
            className="text-sm text-amber-700 hover:text-amber-900 font-medium underline shrink-0"
          >
            Go to Settings
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon
          const CardContent = (
            <div key={card.label} className={`bg-white rounded-xl border p-5 shadow-sm ${card.link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
          if (card.link) {
            return <Link key={card.label} to={card.link}>{CardContent}</Link>
          }
          return CardContent
        })}
      </div>

      {/* CI Pipeline Quota Status Card */}
      <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">CI Pipeline Quotas (GitHub Actions)</h2>
              <p className="text-xs text-gray-500">Monthly runner minutes & artifact storage across 4 GitHub accounts</p>
            </div>
          </div>
          {ciQuotaData && (
            <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Total Pool:</span>
                <span className="font-bold font-mono text-blue-700">{ciQuotaData.total_used_minutes}m used</span>
                <span className="text-gray-400">/</span>
                <span className="font-bold font-mono text-green-700">{ciQuotaData.total_remaining_minutes}m free</span>
                <span className="text-gray-500">({ciQuotaData.total_max_minutes}m limit)</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {ciQuotaData?.providers?.map((provider) => {
            const minutesPercent = provider.max_minutes > 0 ? Math.min(100, Math.round((provider.used_minutes / provider.max_minutes) * 100)) : 0
            const isNearMinuteLimit = provider.used_minutes >= 1600
            return (
              <div key={provider.id} className="border rounded-xl p-4 bg-gray-50/60 hover:bg-white transition-colors flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-semibold text-sm text-gray-900 truncate">{provider.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        provider.has_quota ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {provider.has_quota ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Exhausted
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono text-gray-500 truncate mb-1">
                    <GitBranch className="w-3 h-3 shrink-0 text-gray-400" />
                    <span className="truncate">{provider.repo}</span>
                  </div>
                </div>

                {/* Quota Minutes Bar */}
                <div className="space-y-1.5 pt-2 border-t text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-gray-600 font-medium">
                      <Clock className="w-3 h-3 text-indigo-500" /> Quota Minutes:
                    </span>
                    <span className="font-mono font-semibold text-gray-900">
                      <span className={isNearMinuteLimit ? 'text-amber-600' : 'text-indigo-600'}>{provider.used_minutes}m</span>
                      <span className="text-gray-400 font-normal"> / {provider.max_minutes}m</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isNearMinuteLimit ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.max(3, minutesPercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{provider.runs_this_month} runs this month</span>
                    <span className="font-medium text-green-600">{provider.remaining_minutes}m left</span>
                  </div>
                </div>

                {/* Artifact Storage Bar */}
                <div className="space-y-1 pt-1.5 border-t border-dashed text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1 text-[11px]">
                      <HardDrive className="w-3 h-3 text-gray-400" /> Artifact Storage:
                    </span>
                    <span className="font-mono text-[11px] font-medium text-gray-700">
                      {provider.storage_mb} / {provider.max_storage_mb} MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        provider.storage_mb > 400 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, (provider.storage_mb / provider.max_storage_mb) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {(!ciQuotaData || isLoadingQuota) && (
            <div className="col-span-1 sm:col-span-2 xl:col-span-4 text-center py-6">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
            </div>
          )}
        </div>
      </div>


      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Builds by Status */}
        <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Builds by Status</h2>
          {buildsChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildsChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="status" tick={{ fontSize: 13, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#3b82f6" barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">No build data available.</p>
          )}
        </div>

        {/* Daily Builds */}
        <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Daily Builds (30 days)</h2>
          {dailyBuildsChart.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBuildsChart} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                  <Bar dataKey="success" stackId="a" fill="#10b981" name="Success" />
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">No build data yet.</p>
          )}
        </div>
      </div>

      {/* Daily Revenue */}
      {dailyRevenueChart.length > 0 && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Revenue (30 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenueChart} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                <Line type="monotone" dataKey="inr" stroke="#f59e0b" name="INR" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="usd" stroke="#8b5cf6" name="USD" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Failed Builds */}
      <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Failed Builds</h2>
          </div>
          <Link to="/admin/builds" className="text-sm text-blue-600 hover:underline">
            View all builds
          </Link>
        </div>
        {stats.recent_failures.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_failures.map((failure) => (
              <div key={failure.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {failure.app_name || 'Unknown App'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          failure.platform === 'desktop'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {failure.platform === 'desktop' ? 'Windows' : 'Android'}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 truncate">
                      {failure.error_message || 'No error message available'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {failure.completed_at ? formatDateTime(failure.completed_at) : '-'}
                    </p>
                  </div>
                  <Link
                    to={`/admin/builds?view=${failure.id}`}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap ml-4"
                  >
                    View Log
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No failed builds. All systems healthy.</p>
        )}
      </div>
    </div>
  )
}
