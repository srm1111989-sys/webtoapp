import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { ordersApi, paymentsApi } from '@/api/orders'
import { appsApi } from '@/api/apps'
import { formatCurrency, formatDate } from '@/utils/format'
import { Card, CardHeader, Badge, Skeleton } from '@/components/ui'
import AppList from '@/components/AppList'
import type { Order } from '@/types'
import {
  AppWindow, ShoppingCart, CheckCircle2, Plus, ArrowRight, AlertCircle, FlaskConical, Star,
  Hammer, Wallet, Activity as ActivityIcon, BookOpen, Receipt, Rocket, XCircle, Clock,
} from 'lucide-react'

const orderTone: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'gray'> = {
  paid: 'green', pending: 'amber', completed: 'green', failed: 'red',
}

/** Derive a human activity feed from order + build data (read-only). */
function activityFrom(orders: Order[]) {
  const events: { icon: typeof Rocket; tone: string; text: string; sub: string; to: string }[] = []
  for (const o of orders.slice(0, 12)) {
    if (o.latest_build_status === 'success') {
      events.push({ icon: Rocket, tone: 'text-emerald-600 bg-emerald-50', text: `Build completed for ${o.app_name || 'app'}`, sub: o.latest_build_at ? formatDate(o.latest_build_at) : '', to: `/orders/${o.id}` })
    } else if (o.latest_build_status === 'failed') {
      events.push({ icon: XCircle, tone: 'text-red-600 bg-red-50', text: `Build failed for ${o.app_name || 'app'}`, sub: 'Retry is free', to: `/orders/${o.id}` })
    } else if (o.latest_build_status === 'building') {
      events.push({ icon: Hammer, tone: 'text-primary-600 bg-primary-50', text: `Building ${o.app_name || 'app'}…`, sub: `${o.latest_build_progress ?? 0}%`, to: `/orders/${o.id}` })
    }
    if (o.amount > 0 && o.status === 'paid') {
      events.push({ icon: Wallet, tone: 'text-emerald-600 bg-emerald-50', text: `Payment received — ${o.app_name || o.order_number}`, sub: formatCurrency(o.amount, o.currency), to: `/orders/${o.id}` })
    } else if (o.plan_state === 'pending_payment') {
      events.push({ icon: Clock, tone: 'text-amber-600 bg-amber-50', text: `Payment pending — ${o.app_name || o.order_number}`, sub: 'Complete or it self-clears in 24h', to: `/orders/${o.id}` })
    } else if (o.plan_state === 'free_expired') {
      events.push({ icon: AlertCircle, tone: 'text-amber-600 bg-amber-50', text: `Trial ended — ${o.app_name || 'app'}`, sub: 'Upgrade to reactivate', to: `/orders/${o.id}` })
    }
  }
  return events.slice(0, 6)
}

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: ordersData, isLoading: ordersLoading, isError: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(1, 100),
    select: (res) => res.data,
  })
  const { data: appsData, isLoading: appsLoading, isError: appsError } = useQuery({
    queryKey: ['apps'],
    queryFn: () => appsApi.list(),
    select: (res) => res.data,
  })
  const { data: paymentMode } = useQuery({
    queryKey: ['payment-mode'],
    queryFn: () => paymentsApi.getPaymentMode().then((r) => r.data),
  })

  const orders = ordersData?.orders ?? []
  const apps = (appsData?.apps ?? []).filter((a) => a.status !== 'draft')
  const totalApps = apps.length
  const activeBuilds = orders.filter((o) => o.latest_build_status === 'building' || o.latest_build_status === 'pending').length
  const pendingOrders = orders.filter((o) => o.plan_state === 'pending_payment').length
  const completedBuilds = orders.filter((o) => o.latest_build_status === 'success').length
  const failedBuilds = orders.filter((o) => o.latest_build_status === 'failed').length
  const totalSpent = orders.filter((o) => o.amount > 0 && o.status === 'paid')
    .reduce((s, o) => s + o.amount, 0)
  const spentCurrency = orders.find((o) => o.amount > 0 && o.status === 'paid')?.currency || 'USD'
  const successRate = completedBuilds + failedBuilds > 0
    ? Math.round((completedBuilds / (completedBuilds + failedBuilds)) * 100)
    : null
  const hasPremium = orders.some((o) => o.status === 'paid' && o.amount > 0)
  const recentOrders = orders.slice(0, 5)
  const activity = activityFrom(orders)
  const isLoading = ordersLoading || appsLoading
  const isError = ordersError || appsError

  const stats = [
    { label: 'Total Apps', value: totalApps as number | string, icon: AppWindow, tone: 'text-primary-600 bg-primary-50', to: '/apps', sub: null as string | null },
    { label: 'Active Builds', value: activeBuilds as number | string, icon: Hammer, tone: 'text-blue-600 bg-blue-50', to: '/orders', sub: activeBuilds ? 'in progress' : null },
    { label: 'Pending Orders', value: pendingOrders as number | string, icon: ShoppingCart, tone: 'text-amber-600 bg-amber-50', to: '/orders', sub: null },
    { label: 'Completed Builds', value: completedBuilds as number | string, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50', to: '/orders', sub: successRate !== null ? `${successRate}% success rate` : null },
    { label: 'Total Spent', value: (totalSpent > 0 ? formatCurrency(totalSpent, spentCurrency) : '—') as number | string, icon: Wallet, tone: 'text-purple-600 bg-purple-50', to: '/billing', sub: null },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-ink tracking-tight">
              Welcome back, {(user?.full_name || 'there').split(' ')[0]}! 👋
            </h1>
            {hasPremium && (
              <Badge tone="amber"><Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Premium</Badge>
            )}
          </div>
          <p className="text-sm text-soft mt-1">Here's what's happening with your apps today.</p>
        </div>
        <Link
          to="/apps/create"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition shadow-sm self-start"
        >
          <Plus className="w-4 h-4" /> Create New App
        </Link>
      </div>

      {paymentMode?.test_mode && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <FlaskConical className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs"><span className="font-medium text-amber-900">Payment test mode active.</span>{' '}
            <span className="text-amber-700">No real charges will be made.</span></p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-64" /><Skeleton className="h-64" />
          </div>
        </div>
      ) : isError ? (
        <Card className="p-4 flex items-center gap-2 text-red-700 border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">Failed to load dashboard data. Please refresh the page.</p>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.map(({ label, value, icon: Icon, tone, to, sub }) => (
              <Link key={label} to={to} className="group">
                <Card className="p-4 h-full hover:border-primary-300 hover:shadow-md transition-all">
                  <span className={`inline-flex p-2 rounded-lg ${tone}`}><Icon className="w-4 h-4" /></span>
                  <p className="mt-3 text-xl font-bold text-ink tabular-nums leading-tight">{value}</p>
                  <p className="text-xs text-soft mt-0.5 flex items-center gap-1">
                    {label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </p>
                  {sub && <p className="text-[11px] text-emerald-600 font-medium mt-1">{sub}</p>}
                </Card>
              </Link>
            ))}
          </div>

          {/* Activity + Builds overview */}
          <div className="grid lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader title="Recent Activity" subtitle="Builds, payments and plan changes" action={
                <Link to="/orders" className="text-xs font-semibold text-primary-600 hover:underline">View all →</Link>
              } />
              <div className="px-5 pb-4 divide-y divide-line">
                {activity.length === 0 ? (
                  <div className="py-8 text-center">
                    <ActivityIcon className="w-8 h-8 text-soft/40 mx-auto mb-2" />
                    <p className="text-sm text-soft">No activity yet — create your first app to get started.</p>
                  </div>
                ) : activity.map((e, i) => (
                  <Link key={i} to={e.to} className="flex items-center gap-3 py-2.5 group">
                    <span className={`p-1.5 rounded-lg ${e.tone}`}><e.icon className="w-3.5 h-3.5" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-ink truncate group-hover:text-primary-600 transition">{e.text}</span>
                    </span>
                    <span className="text-xs text-soft shrink-0">{e.sub}</span>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Builds Overview" />
              <div className="px-5 pb-5 flex items-center gap-5">
                {(() => {
                  const total = completedBuilds + activeBuilds + failedBuilds || 1
                  const seg = (n: number) => (n / total) * 100
                  const c = seg(completedBuilds), a = seg(activeBuilds)
                  return (
                    <svg viewBox="0 0 42 42" className="w-28 h-28 shrink-0" role="img" aria-label="Builds by status">
                      <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--color-gray-100)" strokeWidth="5" />
                      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#10b981" strokeWidth="5"
                        strokeDasharray={`${c} ${100 - c}`} strokeDashoffset="25" strokeLinecap="round" />
                      <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--color-primary-500)" strokeWidth="5"
                        strokeDasharray={`${a} ${100 - a}`} strokeDashoffset={`${25 - c}`} strokeLinecap="round" />
                      <text x="21" y="20" textAnchor="middle" fill="var(--color-ink)" style={{ font: '700 8px Inter, sans-serif' }}>
                        {completedBuilds + activeBuilds + failedBuilds}
                      </text>
                      <text x="21" y="27" textAnchor="middle" fill="var(--color-soft)" style={{ font: '4.5px Inter, sans-serif' }}>
                        total
                      </text>
                    </svg>
                  )
                })()}
                <ul className="space-y-2 text-sm w-full">
                  <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed <span className="font-semibold text-ink tabular-nums ml-auto pl-3">{completedBuilds}</span></li>
                  <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> Processing <span className="font-semibold text-ink tabular-nums ml-auto pl-3">{activeBuilds}</span></li>
                  <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Failed <span className="font-semibold text-ink tabular-nums ml-auto pl-3">{failedBuilds}</span></li>
                </ul>
              </div>
              <div className="border-t border-line px-5 py-4">
                <p className="text-xs font-semibold text-soft uppercase tracking-wide mb-2">Quick actions</p>
                <div className="grid grid-cols-3 gap-2">
                  <Link to="/apps/create" className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-line hover:border-primary-300 hover:bg-primary-50 transition text-center">
                    <Plus className="w-4 h-4 text-primary-600" /><span className="text-[11px] font-medium text-ink">Create App</span>
                  </Link>
                  <Link to="/orders" className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-line hover:border-primary-300 hover:bg-primary-50 transition text-center">
                    <Receipt className="w-4 h-4 text-primary-600" /><span className="text-[11px] font-medium text-ink">View Orders</span>
                  </Link>
                  <Link to="/blog/website-to-app-faq" className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-line hover:border-primary-300 hover:bg-primary-50 transition text-center">
                    <BookOpen className="w-4 h-4 text-primary-600" /><span className="text-[11px] font-medium text-ink">Docs</span>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Your apps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink">Your apps</h2>
              <Link to="/apps" className="text-xs font-semibold text-primary-600 hover:underline">Open My Apps →</Link>
            </div>
            <AppList showHeader={false} />
          </div>

          {/* Recent orders */}
          <Card>
            <CardHeader title="Recent Orders" action={
              <Link to="/orders" className="text-xs font-semibold text-primary-600 hover:underline">View all →</Link>
            } />
            <div className="px-5 pb-4 divide-y divide-line">
              {recentOrders.length === 0 ? (
                <p className="py-6 text-sm text-soft text-center">No orders yet.</p>
              ) : recentOrders.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center gap-3 py-2.5 group">
                  <span className="font-mono text-xs text-soft w-28 shrink-0">{o.order_number}</span>
                  <span className="flex-1 min-w-0 text-sm text-ink truncate group-hover:text-primary-600 transition">{o.app_name || '—'}</span>
                  <span className="text-sm font-semibold text-ink tabular-nums">{o.amount > 0 ? formatCurrency(o.amount, o.currency) : 'Free'}</span>
                  <Badge tone={orderTone[o.status] || 'gray'}>{o.status}</Badge>
                  <span className="hidden sm:block text-xs text-soft w-20 text-right">{formatDate(o.created_at)}</span>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
