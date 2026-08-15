import client from './client'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductListResponse,
  Sale,
  SaleCreate,
  SaleUpdate,
  SaleListResponse,
  PosAnalyticsSummary,
  LowStockProduct,
} from '@/types/pos'

const BASE = '/api/pos'

export const posProductsApi = {
  list: (params?: { page?: number; per_page?: number; search?: string; category?: string; is_active?: boolean }) =>
    client.get<ProductListResponse>(BASE + '/products', { params }).then((r) => r.data),

  get: (id: string) =>
    client.get<Product>(`${BASE}/products/${id}`).then((r) => r.data),

  create: (data: ProductCreate) =>
    client.post<Product>(`${BASE}/products`, data).then((r) => r.data),

  update: (id: string, data: ProductUpdate) =>
    client.put<Product>(`${BASE}/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`${BASE}/products/${id}`).then((r) => r.data),

  lowStock: (threshold = 10) =>
    client.get<LowStockProduct[]>(`${BASE}/products/low-stock`, { params: { threshold } }).then((r) => r.data),
}

export const posSalesApi = {
  list: (params?: { page?: number; per_page?: number; start_date?: string; end_date?: string; payment_method?: string; payment_status?: string; search?: string }) =>
    client.get<SaleListResponse>(BASE + '/sales', { params }).then((r) => r.data),

  get: (id: string) =>
    client.get<Sale>(`${BASE}/sales/${id}`).then((r) => r.data),

  create: (data: SaleCreate) =>
    client.post<Sale>(`${BASE}/sales`, data).then((r) => r.data),

  update: (id: string, data: SaleUpdate) =>
    client.put<Sale>(`${BASE}/sales/${id}`, data).then((r) => r.data),

  cancel: (id: string) =>
    client.delete(`${BASE}/sales/${id}`).then((r) => r.data),

  analyticsSummary: (params?: { start_date?: string; end_date?: string }) =>
    client.get<PosAnalyticsSummary>(`${BASE}/analytics/summary`, { params }).then((r) => r.data),
}
