export function formatCurrency(amount: number, currency: string): string {
  const value = amount / 100
  if (currency === 'INR') {
    return `₹${value.toLocaleString('en-IN')}`
  }
  return `$${value.toFixed(2)}`
}

let _detectedCurrency: 'INR' | 'USD' | null = null

export function getUserCurrency(): 'INR' | 'USD' {
  return 'USD'
}

export function formatPlanPrice(priceInr: number, priceUsd: number): string {
  const currency = getUserCurrency()
  return currency === 'INR' ? formatCurrency(priceInr, 'INR') : formatCurrency(priceUsd, 'USD')
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
