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
  bundle_id?: string
  team_id?: string
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
}

export interface Build {
  id: string
  order_id: string
  pipeline_id?: number
  status: 'pending' | 'building' | 'success' | 'failed'
  platform: 'android' | 'ios'
  build_type: string
  apk_url?: string
  aab_url?: string
  ipa_url?: string
  dsym_url?: string
  source_url?: string
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
