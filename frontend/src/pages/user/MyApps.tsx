import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { appsApi } from '@/api/apps'
import { formatDate } from '@/utils/format'
import { AppWindow, Plus, Globe, Loader2, AlertCircle } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  building: 'bg-blue-100 text-blue-800',
  disabled: 'bg-red-100 text-red-800',
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Apps</h1>
          <p className="mt-1 text-gray-500">
            Manage your web-to-app conversions.
          </p>
        </div>
        <Link
          to="/apps/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create App
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : isError ? (
        <div className="rounded-lg bg-red-50 p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Failed to load your apps. Please try refreshing the page.</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-xl border py-16 text-center">
          <AppWindow className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No apps yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first app to convert any website into a native mobile
            app.
          </p>
          <Link
            to="/apps/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create New App
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border hover:shadow-md transition overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* App icon */}
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt={app.name}
                      className="w-14 h-14 rounded-xl object-cover border shrink-0"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: app.primary_color || '#6366f1',
                      }}
                    >
                      <AppWindow className="w-7 h-7 text-white" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {app.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 truncate">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{app.url}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {app.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    Created {formatDate(app.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
