import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Loader2, X, FileText, Download, ExternalLink } from 'lucide-react'

const GITLAB_ANDROID_URL = 'https://gitlab.com/mokashiswapnil11/webtoapp-android-template'
const GITLAB_DESKTOP_URL = 'https://gitlab.com/mokashiswapnil11/webtoapp-desktop-template'

function pipelineUrl(build: any) {
  if (!build.pipeline_id) return null
  const base = build.platform === 'desktop' ? GITLAB_DESKTOP_URL : GITLAB_ANDROID_URL
  return `${base}/-/pipelines/${build.pipeline_id}`
}
import { adminApi } from '@/api/admin'
import { formatDateTime } from '@/utils/format'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'building', label: 'Building' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
]

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    building: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

function LogModal({ buildId, onClose }: { buildId: string; onClose: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'build-log', buildId],
    queryFn: () => adminApi.getBuildLog(buildId).then((r) => r.data),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Build Log</h3>
            <p className="text-sm text-gray-500 font-mono">{buildId.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <p className="text-red-500">Failed to load build log.</p>
          ) : data ? (
            <div className="space-y-4">
              {data.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">Error Summary</h4>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">{data.error_message}</pre>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Log</h4>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[50vh] leading-relaxed">
                  {data.log}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function AdminBuilds() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewLogId, setViewLogId] = useState<string | null>(null)
  const perPage = 20

  // Open log modal from URL param (from dashboard "View Log" link)
  useEffect(() => {
    const viewId = searchParams.get('view')
    if (viewId) setViewLogId(viewId)
  }, [searchParams])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'builds', page, statusFilter],
    queryFn: () => adminApi.listBuilds(page, perPage, statusFilter || undefined).then((r) => r.data),
  })

  const builds = Array.isArray(data) ? data : []
  const totalPages = Math.max(1, Math.ceil(builds.length / perPage))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Builds</h1>
        <p className="text-gray-500 mt-1">Monitor build pipelines and view failure logs</p>
      </div>

      {/* Filter */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500">Failed to load builds.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">ID</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Order ID</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Pipeline</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Platform</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">APK / Error</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Started</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {builds.map((build) => (
                    <tr key={build.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-900">{build.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">{build.order_id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        {pipelineUrl(build) ? (
                          <a href={pipelineUrl(build)!} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-mono">
                            #{build.pipeline_id} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-sm text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            build.platform === 'desktop'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {build.platform === 'desktop' ? 'Windows' : 'Android'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(build.status)}`}
                        >
                          {build.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {build.apk_url ? (
                          <a href={build.apk_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 font-medium">
                            <Download className="w-3.5 h-3.5" /> Download APK
                          </a>
                        ) : build.error_message ? (
                          <p className="text-sm text-red-600 truncate" title={build.error_message}>
                            {build.error_message.split('\n')[0]}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {build.started_at ? formatDateTime(build.started_at) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setViewLogId(build.id)}
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          title="View build log"
                        >
                          <FileText className="w-4 h-4" />
                          Log
                        </button>
                      </td>
                    </tr>
                  ))}
                  {builds.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        No builds found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Log Modal */}
      {viewLogId && <LogModal buildId={viewLogId} onClose={() => setViewLogId(null)} />}
    </div>
  )
}
