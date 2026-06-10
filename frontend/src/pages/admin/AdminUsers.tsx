import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Search, ChevronLeft, ChevronRight, Loader2, Ban, CheckCircle2, FlaskConical, ExternalLink, Download } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { formatDate } from '@/utils/format'

function UserTestModeToggle({ userId }: { userId: string }) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin', 'user-test-mode', userId],
    queryFn: () => adminApi.getUserTestMode(userId).then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: (enable: boolean) => adminApi.toggleUserTestMode(userId, enable),
    onSuccess: (_, enable) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-test-mode', userId] })
      toast.success(`Test mode ${enable ? 'enabled' : 'disabled'}`)
    },
    onError: () => {
      toast.error('Failed to update test mode')
    },
  })

  const isEnabled = data?.test_mode ?? false

  return (
    <button
      onClick={() => mutation.mutate(!isEnabled)}
      disabled={mutation.isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        isEnabled
          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
      title={isEnabled ? 'Test mode enabled — click to disable' : 'Enable test mode for this user'}
    >
      <FlaskConical className="w-3.5 h-3.5" />
      {isEnabled ? 'Test' : 'Live'}
    </button>
  )
}

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const perPage = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => adminApi.listUsers(page, perPage, search || undefined).then((r) => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminApi.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User status updated')
    },
    onError: () => {
      toast.error('Failed to update user status')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.total / perPage) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage platform users</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by name or email..."
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500">Failed to load users.</p>
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden divide-y">
              {data?.users.map((user) => (
                <div key={user.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Banned'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatDate(user.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <UserTestModeToggle userId={user.id} />
                      <button
                        onClick={() => statusMutation.mutate({ userId: user.id, isActive: !user.is_active })}
                        disabled={statusMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.is_active ? <><Ban className="w-3.5 h-3.5" /> Ban</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {data?.users.length === 0 && (
                <div className="text-center py-12 text-gray-400">No users found.</div>
              )}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Website URL</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Build / Pipeline</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">APK</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Account</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Payment</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Joined</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        {(user as any).app_url ? (
                          <a href={(user as any).app_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate block" title={(user as any).app_url}>
                            {(user as any).app_url.replace(/^https?:\/\//, '')}
                          </a>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {(user as any).app_status ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                              (user as any).app_status === 'completed' ? 'bg-green-100 text-green-700'
                              : (user as any).app_status === 'building' ? 'bg-blue-100 text-blue-700'
                              : (user as any).app_status === 'failed' ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}>{(user as any).app_status}</span>
                          ) : null}
                          {(user as any).pipeline_url ? (
                            <a href={(user as any).pipeline_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800">
                              #{(user as any).pipeline_id} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(user as any).apk_url ? (
                          <a href={(user as any).apk_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                            <Download className="w-3 h-3" /> APK
                          </a>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <UserTestModeToggle userId={user.id} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatDate(user.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              userId: user.id,
                              isActive: !user.is_active,
                            })
                          }
                          disabled={statusMutation.isPending}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <Ban className="w-3.5 h-3.5" /> Ban
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.users.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({data?.total} total)
                </span>
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
    </div>
  )
}
