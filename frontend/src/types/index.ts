export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface Plan {
  id: string
  name: string
  slug: string
  description?: string
  price_inr: number
  price_usd: number
  billing_type: 'one_time' | 'monthly'
  features: Record<string, boolean>
  max_apps: number
  is_active: boolean
  sort_order: number
}

export interface AppConfig {
  id: string
  user_id: string
  name: string
  url: string
  package_name?: string
  description?: string
  icon_url?: string
  splash_url?: string
  primary_color: string
  secondary_color: string
  status_bar_color: string
  navigation_type: 'none' | 'bottom_nav' | 'drawer'
  navigation_items?: NavigationItem[]
  features: Record<string, boolean>
  firebase_config?: FirebaseConfig
  admob_config?: AdmobConfig
  selected_platforms?: ('android' | 'desktop')[]
  desktop_config?: DesktopConfig
  custom_user_agent?: string
  status: string
  created_at: string
  updated_at: string
}

export interface NavigationItem {
  label: string
  url: string
  icon?: string
}

export interface FirebaseConfig {
  google_services_json?: string
  server_key?: string
}

export interface AdmobConfig {
  app_id?: string
  banner_id?: string
  interstitial_id?: string
  rewarded_id?: string
}

export interface Order {
  id: string
  user_id: string
  app_config_id: string
  plan_id: string
  order_number: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_gateway?: string
  gateway_order_id?: string
  created_at: string
  updated_at: string
  builds?: Build[]
  plan_name?: string
  app_name?: string
  selected_platforms?: ('android' | 'desktop')[]
}

export interface DesktopConfig {
  window_width: number
  window_height: number
  min_width: number
  min_height: number
  show_title_bar: boolean
  show_menu_bar: boolean
  enable_system_tray: boolean
  start_maximized: boolean
  start_fullscreen: boolean
}

export interface Build {
  id: string
  order_id: string
  pipeline_id?: number
  status: 'pending' | 'building' | 'success' | 'failed'
  platform: 'android' | 'desktop'
  build_type: string
  apk_url?: string
  aab_url?: string
  exe_url?: string
  source_url?: string
  keystore_url?: string
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  gateway: string
  gateway_payment_id?: string
  amount: number
  currency: string
  status: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AdminStats {
  users: number
  orders: number
  revenue_inr: number
  revenue_usd: number
  builds: Record<string, number>
}

export interface AdminEnhancedStats extends AdminStats {
  total_builds: number
  failed_builds: number
  failure_rate: number
  active_subscriptions: number
  recent_failures: RecentFailure[]
  daily_revenue: DailyRevenue[]
  daily_builds: DailyBuild[]
}

export interface RecentFailure {
  id: string
  order_id: string
  platform: string
  error_message?: string
  completed_at?: string
  app_name?: string
}

export interface DailyRevenue {
  date: string
  currency: string
  total: number
}

export interface DailyBuild {
  date: string
  status: string
  count: number
}

export interface BuildLog {
  build_id: string
  status: string
  error_message?: string
  log: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  gateway: string
  gateway_subscription_id?: string
  status: 'pending' | 'active' | 'halted' | 'cancelled' | 'expired'
  current_period_start?: string
  current_period_end?: string
  cancelled_at?: string
  plan_name?: string
  created_at: string
}

export interface SubscriptionPayment {
  id: string
  gateway_payment_id?: string
  amount: number
  currency: string
  status: string
  paid_at?: string
  created_at: string
}

export interface SubscriptionDetail extends Subscription {
  payments: SubscriptionPayment[]
}

export interface SubscriptionCreateResponse {
  subscription_id: string
  gateway_subscription_id?: string
  razorpay_key_id?: string
  checkout_url?: string
  session_id?: string
}
