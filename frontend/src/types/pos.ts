export interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  category?: string
  price: number
  cost?: number
  stock_qty: number
  is_active: boolean
  image_url?: string
  created_at: string
  updated_at: string
}

export interface ProductCreate {
  name: string
  description?: string
  sku?: string
  category?: string
  price: number
  cost?: number
  stock_qty?: number
  is_active?: boolean
  image_url?: string
}

export interface ProductUpdate extends Partial<ProductCreate> {}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  per_page: number
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  cost_price?: number
  subtotal: number
  created_at: string
}

export interface Sale {
  id: string
  order_number: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  items?: unknown[]
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  notes?: string
  sale_items: SaleItem[]
  created_at: string
  updated_at: string
}

export interface SaleCreate {
  order_number?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  items: SaleItemCreate[]
  subtotal: number
  tax_amount?: number
  discount_amount?: number
  total_amount: number
  payment_method?: string
  payment_status?: string
  notes?: string
}

export interface SaleItemCreate {
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  cost_price?: number
}

export interface SaleUpdate {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  payment_method?: string
  payment_status?: string
  notes?: string
}

export interface SaleListResponse {
  sales: Sale[]
  total: number
  page: number
  per_page: number
}

export interface PosDailyRevenue {
  date: string
  total_revenue: number
  total_sales: number
  total_items: number
}

export interface PosTopProduct {
  product_id: string
  product_name: string
  total_quantity: number
  total_revenue: number
}

export interface PosAnalyticsSummary {
  period: string
  total_revenue: number
  total_sales: number
  total_items: number
  avg_order_value: number
  total_tax: number
  total_discount: number
  daily_revenue: PosDailyRevenue[]
  top_products: PosTopProduct[]
  payment_methods: Record<string, number>
}

export interface PaymentMethodStat {
  payment_method: string
  total_amount: number
  count: number
}

export interface LowStockProduct {
  id: string
  name: string
  stock_qty: number
  low_stock_threshold: number
  is_active: boolean
}
