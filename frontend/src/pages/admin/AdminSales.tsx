import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Eye,
  Trash2,
  X,
  Receipt,
  AlertTriangle,
} from 'lucide-react'
import { posSalesApi } from '@/api/pos'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Sale, SaleUpdate, SaleItem } from '@/types/pos'

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'online', 'other']
const PAYMENT_STATUSES = ['paid', 'pending', 'refunded', 'partial', 'cancelled']

const PAY_METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  online: 'Online',
  other: 'Other',
}

const PAY_STATUS_BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-red-100 text-red-700',
  partial: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

function SaleDetailModal({ sale, onClose, onUpdate }: { sale: Sale; onClose: () => void; onUpdate: (id: string, data: SaleUpdate) => void }) {
  const [form, setForm] = useState<SaleUpdate>({
    customer_name: sale.customer_name ?? '',
    customer_email: sale.customer_email ?? '',
    customer_phone: sale.customer_phone ?? '',
    payment_method: sale.payment_method,
    payment_status: sale.payment_status,
    notes: sale.notes ?? '',
  })
  const saving = false

  const handle = (field: keyof SaleUpdate, value: string) => setForm((p) => ({ ...p, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Sale {sale.order_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer Name</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => handle('customer_name', e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer Email</label>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => handle('customer_email', e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer Phone</label>
              <input
                type="text"
                value={form.customer_phone}
                onChange={(e) => handle('customer_phone', e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Method</label>
              <select
                value={form.payment_method}
                onChange={(e) => handle('payment_method', e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAY_METHOD_LABEL[m] ?? m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Status</label>
              <select
                value={form.payment_status}
                onChange={(e) => handle('payment_status', e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handle('notes', e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Line Items</h3>
            <div className="space-y-2">
              {sale.sale_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × {formatCurrency(item.unit_price, 'INR')}
                      {item.cost_price !== undefined && item.cost_price !== null && (
                        <span className="text-gray-400 ml-2">(cost: {formatCurrency(item.cost_price, 'INR')})</span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums ml-3">{formatCurrency(item.subtotal, 'INR')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Close</button>
            <button
              onClick={() => { onUpdate(sale.id, form); onClose() }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminSales() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Sale | null>(null)
  const perPage = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'pos', 'sales', page, paymentMethod, paymentStatus, startDate, endDate, search],
    queryFn: () =>
      posSalesApi.list({
        page,
        per_page: perPage,
        payment_method: paymentMethod || undefined,
        payment_status: paymentStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: search || undefined,
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => posSalesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'sales'] })
      toast.success('Sale cancelled and stock restored')
      setSelected(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to cancel sale'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaleUpdate }) => posSalesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'sales'] })
      toast.success('Sale updated')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to update sale'),
  })

  const totalPages = data ? Math.ceil(data.total / perPage) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <p className="text-gray-500 mt-1">All point-of-sale transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by order #, customer name/email..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={paymentMethod}
            onChange={(e) => { setPaymentMethod(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{PAY_METHOD_LABEL[m] ?? m}</option>
            ))}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {(paymentMethod || paymentStatus || startDate || endDate) && (
            <button
              onClick={() => { setPaymentMethod(''); setPaymentStatus(''); setStartDate(''); setEndDate(''); setPage(1) }}
              className="text-xs text-indigo-600 hover:underline self-center"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Failed to load sales</div>
        ) : !data?.sales.length ? (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">No sales found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Order #</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Method</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Total</th>
                  <th className="text-right px-5 py-3">Items</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{sale.order_number}</td>
                    <td className="px-5 py-3">
                      <span className="text-gray-900">{sale.customer_name || '—'}</span>
                      {sale.customer_email && <div className="text-xs text-gray-500">{sale.customer_email}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{PAY_METHOD_LABEL[sale.payment_method] ?? sale.payment_method}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PAY_STATUS_BADGE[sale.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatCurrency(sale.total_amount, 'INR')}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{sale.sale_items?.length ?? 0}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDate(sale.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setSelected(sale)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.payment_status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (confirm('Cancel this sale and restore stock?')) cancelMutation.mutate(sale.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages} ({data?.total} total)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <SaleDetailModal
          sale={selected}
          onClose={() => setSelected(null)}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        />
      )}
    </div>
  )
}
