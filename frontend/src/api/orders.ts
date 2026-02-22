import client from './client'
import type { Order, Build, Subscription, SubscriptionDetail, SubscriptionCreateResponse } from '@/types'

export const ordersApi = {
  create: (data: { app_config_id: string; plan_id: string; currency?: string; payment_gateway?: string }) =>
    client.post<Order>('/api/orders/', data),

  list: (page = 1, per_page = 20) =>
    client.get<{ orders: Order[]; total: number; page: number; per_page: number }>(
      `/api/orders/?page=${page}&per_page=${per_page}`
    ),

  get: (id: string) =>
    client.get<Order>(`/api/orders/${id}`),
}

export const buildsApi = {
  getForOrder: (orderId: string) =>
    client.get<Build[]>(`/api/builds/order/${orderId}`),

  get: (id: string) =>
    client.get<Build>(`/api/builds/${id}`),

  trigger: (orderId: string, platform: string = 'android') =>
    client.post<Build>(`/api/builds/trigger/${orderId}?platform=${platform}`),
}

export const paymentsApi = {
  createRazorpay: (orderId: string) =>
    client.post<{ razorpay_order_id: string; razorpay_key_id: string; amount: number; currency: string; order_id: string }>(
      `/api/payments/razorpay/create?order_id=${orderId}`
    ),

  verifyRazorpay: (data: {
    order_id: string
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) =>
    client.post<{ message: string }>('/api/payments/razorpay/verify', data),

  createStripeCheckout: (orderId: string) =>
    client.post<{ checkout_url: string; session_id: string }>('/api/payments/stripe/checkout', { order_id: orderId }),

  testPayment: (orderId: string) =>
    client.post<{ message: string }>('/api/payments/test', { order_id: orderId }),

  getPaymentMode: () =>
    client.get<{ test_mode: boolean; environment: string; gateways: { razorpay: boolean; stripe: boolean } }>('/api/payments/mode'),
}

export const plansApi = {
  list: () =>
    client.get<Plan[]>('/api/plans/'),
}

export const subscriptionsApi = {
  create: (data: { plan_id: string; currency: string; app_config_id: string }) =>
    client.post<SubscriptionCreateResponse>('/api/subscriptions/', data),

  list: () =>
    client.get<Subscription[]>('/api/subscriptions/'),

  getActive: () =>
    client.get<Subscription | null>('/api/subscriptions/active'),

  get: (id: string) =>
    client.get<SubscriptionDetail>(`/api/subscriptions/${id}`),

  cancel: (id: string) =>
    client.post<Subscription>(`/api/subscriptions/${id}/cancel`),
}

import type { Plan } from '@/types'
