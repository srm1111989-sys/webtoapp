import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { appsApi } from '@/api/apps'
import { formatDate } from '@/utils/format'
import { AppWindow, Plus, Globe, Loader2, AlertCircle, Smartphone, Monitor, ArrowRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border border-amber-200',
  active: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  building: 'bg-blue-50 text-blue-700 border border-blue-200',
  disabled: 'bg-red-50 text-red-700 border border-red-200',
}

export default function MyApps() {
  const {
    data: appsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.list(),
    select: (res) => res.data,
  })

  const apps = appsData?.apps ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Apps</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all your app conversions in one place
          </p>
        </div>
        <Link
          to="/apps/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200 hover:shadow-xl font-medium self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create New App
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 flex items-start gap-3 text-red-700">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load apps</p>
            <p className="text-sm mt-1 text-red-600">Please try refreshing the page or contact support if the issue persists.</p>
          </div>
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="inline-flex p-5 rounded-full bg-primary-50 mb-6">
            <AppWindow className="w-16 h-16 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No apps yet
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start converting your websites into native Android and Windows apps in just a few minutes
          </p>
          <Link
            to="/apps/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Your First App
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Link
              key={app.id}
              to={`/apps/${app.id}`}
              className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="p-6">
                {/* Header with icon and name */}
                <div className="flex items-start gap-4 mb-4">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt={app.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl border-2 border-gray-100 flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: app.primary_color || '#6366f1',
                      }}
                    >
                      <AppWindow className="w-8 h-8 text-white" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary-600 transition">
                      {app.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span className="truncate">{new URL(app.url).hostname}</span>
                    </div>
                  </div>
                </div>

                {/* Platform badges */}
                {(app.selected_platforms && app.selected_platforms.length > 0) && (
                  <div className="flex gap-2 mb-4">
                    {app.selected_platforms.includes('android') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                        <Smartphone className="w-3.5 h-3.5" />
                        Android
                      </span>
                    )}
                    {app.selected_platforms.includes('desktop') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                        <Monitor className="w-3.5 h-3.5" />
                        Desktop
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-50">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${statusColors[app.status] ?? 'bg-gray-50 text-gray-700 border border-gray-200'}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 group-hover:text-primary-600 transition">
                    <span className="hidden sm:inline">View details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>

                {/* Creation date */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    Created {formatDate(app.created_at)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
