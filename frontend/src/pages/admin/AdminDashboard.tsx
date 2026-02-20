import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, ShoppingCart, IndianRupee, DollarSign, Loader2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { formatCurrency } from '@/utils/format'

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  })

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
  ]

  const buildsChartData = Object.entries(stats.builds).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }))

  const getBarColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#f59e0b'
      case 'building':
        return '#3b82f6'
      case 'success':
        return '#10b981'
      case 'failed':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your platform</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl border p-5 shadow-sm">
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
        })}
      </div>

      {/* Builds Chart */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Builds by Status</h2>
        {buildsChartData.length > 0 ? (
          <div className="h-80">
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
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  fill="#3b82f6"
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-12">No build data available.</p>
        )}
      </div>
    </div>
  )
}
