import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ListOrdered,
  CreditCard,
  Trophy,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { posSalesApi } from '@/api/pos'
import { formatCurrency } from '@/utils/format'
import type { PosAnalyticsSummary } from '@/types/pos'

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const PAY_METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  online: 'Online',
  other: 'Other',
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function AdminSalesAnalytics() {
  const [days, setDays] = useState(30)
  const [startDate, setStartDate] = useState(daysAgoISO(30))
  const [endDate, setEndDate] = useState(todayISO())

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'pos', 'analytics', startDate, endDate],
    queryFn: () => posSalesApi.analyticsSummary({ start_date: startDate, end_date: endDate }),
  })

  const applyRange = (d: number) => {
    setDays(d)
    setStartDate(daysAgoISO(d))
    setEndDate(todayISO())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500">Failed to load analytics.</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.total_revenue, 'INR'),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Total Sales',
      value: data.total_sales.toLocaleString(),
      icon: ShoppingBag,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Items Sold',
      value: data.total_items.toLocaleString(),
      icon: ListOrdered,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(data.avg_order_value, 'INR'),
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  const dailyChart = data.daily_revenue.map((d) => ({
    date: d.date.slice(5), // MM-DD
    revenue: d.total_revenue,
    sales: d.total_sales,
  }))

  const topProductsChart = data.top_products.map((p) => ({
    name: p.product_name.length > 20 ? p.product_name.slice(0, 18) + '…' : p.product_name,
    revenue: p.total_revenue,
    quantity: p.total_quantity,
  }))

  const paymentMethodsChart = Object.entries(data.payment_methods).map(([method, amount], i) => ({
    name: PAY_METHOD_LABEL[method] ?? method,
    value: amount,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
          <p className="text-gray-500 mt-1">Revenue, trends, and top products</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => applyRange(r.days)}
                className={`px-3 py-1.5 text-sm rounded ${days === r.days ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white border rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDays(-1) }}
              className="text-sm focus:outline-none"
            />
            <span className="text-gray-400">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDays(-1) }}
              className="text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border shadow-sm p-4">
            <span className={`inline-flex p-2 rounded-lg ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </span>
            <p className="mt-3 text-xl font-bold text-gray-900 tabular-nums leading-tight">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Daily Revenue</h2>
        {dailyChart.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No sales in this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(v: number, k: string) =>
                  k === 'revenue' ? formatCurrency(v, 'INR') : v
                }
                contentStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Top Products
          </h2>
          {topProductsChart.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No product sales yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProductsChart} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={130} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, 'INR')}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" /> Payment Methods
          </h2>
          {paymentMethodsChart.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No payment data yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie
                    data={paymentMethodsChart}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {paymentMethodsChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, 'INR')} contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-2 text-sm">
                {paymentMethodsChart.map((m) => (
                  <li key={m.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: m.color }} />
                    <span className="text-gray-700">{m.name}</span>
                    <span className="ml-auto font-semibold tabular-nums">{formatCurrency(m.value, 'INR')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}