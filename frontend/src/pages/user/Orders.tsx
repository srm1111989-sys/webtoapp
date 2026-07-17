import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { formatCurrency, formatDate } from '@/utils/format'
import { Card, Badge, Skeleton, PageHeader } from '@/components/ui'
import { ShoppingCart, AlertCircle, ChevronRight, Search } from 'lucide-react'
import clsx from 'clsx'

const statusTone: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray'> = {
  pending: 'amber',
  paid: 'green',
  free: 'blue',
  failed: 'red',
  refunded: 'gray',
}

const orderLabel = (status: string, amount: number) =>
  status === 'paid' && amount === 0 ? 'free' : status

const FILTERS = ['all', 'paid', 'free', 'pending', 'failed'] as const

export default function Orders() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')

  const {
    data: ordersData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(1, 50),
    select: (res) => res.data,
  })

  const orders = ordersData?.orders ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const label = orderLabel(o.status, o.amount)
      if (filter !== 'all' && label !== filter) return false
      if (!q) return true
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.app_name ?? '').toLowerCase().includes(q) ||
        (o.plan_name ?? '').toLowerCase().includes(q)
      )
    })
  }, [orders, query, filter])

  return (
    <div className="animate-fade-up">
      <PageHeader title="Orders" subtitle="Track all your orders and build statuses." />

      {/* Toolbar: search + status filter */}
      {!isLoading && !isError && orders.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order #, app, plan…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-line rounded-lg text-ink placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors',
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface border border-line text-soft hover:text-ink hover:border-gray-300',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-4 flex items-center gap-3 text-red-700 border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">Failed to load orders. Please try refreshing the page.</p>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="py-16 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto text-soft/40 mb-4" />
          <h3 className="text-lg font-semibold text-ink mb-1">No orders yet</h3>
          <p className="text-sm text-soft mb-4">
            Your orders will appear here after you create an app and choose a plan.
          </p>
          <Link
            to="/apps/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            Create an App
          </Link>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-soft">No orders match your search.</p>
        </Card>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block">
                <Card className="p-4 hover:border-primary-300 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium font-mono text-ink">{order.order_number}</span>
                    <Badge tone={statusTone[orderLabel(order.status, order.amount)] ?? 'gray'}>
                      {orderLabel(order.status, order.amount)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-soft truncate">{order.app_name ?? '-'} · {order.plan_name ?? '-'}</span>
                    <span className="font-semibold text-ink tabular-nums shrink-0 pl-2">
                      {order.amount > 0 ? formatCurrency(order.amount, order.currency) : 'Free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-soft">{formatDate(order.created_at)}</span>
                    <span className="text-primary-600 text-xs font-medium inline-flex items-center gap-0.5">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop table layout */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line bg-gray-50">
                    <th className="px-6 py-3 text-[11px] font-semibold text-soft uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-soft uppercase tracking-wider">App</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-soft uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-soft uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-soft uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-soft uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono font-medium text-ink whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-soft whitespace-nowrap max-w-48 truncate">
                        {order.app_name ?? '-'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-soft whitespace-nowrap">
                        {order.plan_name ?? '-'}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-ink whitespace-nowrap tabular-nums">
                        {order.amount > 0 ? formatCurrency(order.amount, order.currency) : 'Free'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Badge tone={statusTone[orderLabel(order.status, order.amount)] ?? 'gray'}>
                          {orderLabel(order.status, order.amount)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-soft whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-sm font-medium"
                        >
                          View
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
