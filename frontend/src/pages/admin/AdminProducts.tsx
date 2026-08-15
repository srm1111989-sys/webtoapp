import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Package, Loader2, X, Search, AlertTriangle } from 'lucide-react'
import { posProductsApi } from '@/api/pos'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Product, ProductCreate, ProductUpdate } from '@/types/pos'

const EMPTY_FORM: ProductCreate = {
  name: '',
  description: '',
  sku: '',
  category: '',
  price: 0,
  cost: 0,
  stock_qty: 0,
  is_active: true,
  image_url: '',
}

interface ProductFormProps {
  initial: Product | null
  onSave: (data: ProductCreate) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function ProductForm({ initial, onSave, onCancel, saving }: ProductFormProps) {
  const [form, setForm] = useState<ProductCreate>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          sku: initial.sku ?? '',
          category: initial.category ?? '',
          price: initial.price,
          cost: initial.cost ?? 0,
          stock_qty: initial.stock_qty,
          is_active: initial.is_active,
          image_url: initial.image_url ?? '',
        }
      : EMPTY_FORM
  )

  const handle = (field: keyof ProductCreate, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{initial ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handle('name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => handle('sku', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => handle('category', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handle('description', e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => handle('price', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost ?? 0}
                onChange={(e) => handle('cost', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={form.stock_qty ?? 0}
                onChange={(e) => handle('stock_qty', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => handle('image_url', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active ?? true}
              onChange={(e) => handle('is_active', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active (sellable)</label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const perPage = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'pos', 'products', page, search, category, showInactive],
    queryFn: () =>
      posProductsApi.list({
        page,
        per_page: perPage,
        search: search || undefined,
        category: category || undefined,
        is_active: showInactive ? undefined : true,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (form: ProductCreate) => posProductsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] })
      toast.success('Product created')
      setCreating(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to create product'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      posProductsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] })
      toast.success('Product updated')
      setEditing(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to update product'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => posProductsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pos', 'products'] })
      toast.success('Product deactivated')
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to deactivate product'),
  })

  const totalPages = data ? Math.ceil(data.total / perPage) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, SKU, or description..."
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input
          type="text"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          placeholder="Category"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => { setShowInactive(e.target.checked); setPage(1) }}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Failed to load products</div>
        ) : !data?.products.length ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">No products yet. Create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">SKU</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-right px-5 py-3">Price</th>
                  <th className="text-right px-5 py-3">Stock</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Created</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      {p.description && <div className="text-xs text-gray-500 line-clamp-1">{p.description}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-700 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="px-5 py-3 text-gray-700">{p.category || '—'}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{formatCurrency(p.price, 'INR')}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-medium tabular-nums ${p.stock_qty < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.stock_qty < 10 && <AlertTriangle className="w-3 h-3" />}
                        {p.stock_qty}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{formatDate(p.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {p.is_active && (
                          <button
                            onClick={() => {
                              if (confirm('Deactivate this product?')) deleteMutation.mutate(p.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Deactivate"
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
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Form modals */}
      {creating && (
        <ProductForm
          initial={null}
          onSave={async (form) => { await createMutation.mutateAsync(form) }}
          onCancel={() => setCreating(false)}
          saving={createMutation.isPending}
        />
      )}
      {editing && (
        <ProductForm
          initial={editing}
          onSave={async (form) => {
            await updateMutation.mutateAsync({ id: editing.id, data: form })
          }}
          onCancel={() => setEditing(null)}
          saving={updateMutation.isPending}
        />
      )}
    </div>
  )
}
