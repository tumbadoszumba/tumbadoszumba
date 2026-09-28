import { create } from "zustand"

interface DashboardStats {
  totalProducts: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
}

interface OrdersByStatus {
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customer: string
  email: string
  total: number
  status: string
  createdAt: string
}

interface AdminOrder {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  status: string
  subtotal: number
  shipping: number
  total: number
  paymentMethod: string
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  items: {
    name: string
    quantity: number
    price: number
    total: number
    image: string
  }[]
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface AdminProforma {
  id: string
  status: string
  area: number
  contactName: string | null
  contactPhone: string | null
  createdAt: string
  deletedAt: string | null
  daysRemaining: number | null
  user: { id: string; name: string; email: string; phone: string | null }
  calculator: { id: string; name: string }
  itemCount: number
  total: number
}

interface AdminUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: string
  createdAt: string
  orders: number
  totalSpent: number
}

interface AdminState {
  // Dashboard
  stats: DashboardStats | null
  ordersByStatus: OrdersByStatus | null
  recentOrders: RecentOrder[]

  // Orders
  orders: AdminOrder[]
  ordersTotal: number

  // Users
  users: AdminUser[]

  // Proformas
  proformas: AdminProforma[]
  proformasTotal: number
  proformasPendientes: number
  proformasCotizadas: number
  proformasTrashCount: number

  loading: boolean
  error: string | null

  // Actions
  fetchDashboard: () => Promise<void>
  fetchOrders: (params?: { status?: string; limit?: number; offset?: number }) => Promise<void>
  fetchUsers: (params?: { role?: string; status?: string }) => Promise<void>
  updateUserStatus: (id: string, status: string) => Promise<void>
  updateOrderStatus: (id: string, status: string) => Promise<void>
  fetchProformas: (params?: { status?: string; userId?: string; q?: string; trash?: boolean }) => Promise<void>
  updateProforma: (
    id: string,
    patch: { status?: string; contactName?: string; contactPhone?: string }
  ) => Promise<void>
  trashProforma: (id: string) => Promise<void>
  restoreProforma: (id: string) => Promise<void>
  deleteProformaPermanently: (id: string) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  ordersByStatus: null,
  recentOrders: [],
  orders: [],
  ordersTotal: 0,
  users: [],
  proformas: [],
  proformasTotal: 0,
  proformasPendientes: 0,
  proformasCotizadas: 0,
  proformasTrashCount: 0,
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch("/api/admin/dashboard")
      if (!response.ok) throw new Error("Error fetching dashboard")
      const data = await response.json()
      set({
        stats: data.stats,
        ordersByStatus: data.ordersByStatus,
        recentOrders: data.recentOrders,
        loading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  fetchOrders: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const searchParams = new URLSearchParams()
      if (params.status) searchParams.set("status", params.status)
      if (params.limit) searchParams.set("limit", params.limit.toString())
      if (params.offset) searchParams.set("offset", params.offset.toString())

      const response = await fetch(`/api/admin/orders?${searchParams}`)
      if (!response.ok) throw new Error("Error fetching orders")
      const data = await response.json()
      set({
        orders: data.orders,
        ordersTotal: data.total,
        loading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  fetchUsers: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const searchParams = new URLSearchParams()
      if (params.role) searchParams.set("role", params.role)
      if (params.status) searchParams.set("status", params.status)

      const response = await fetch(`/api/users?${searchParams}`)
      if (!response.ok) throw new Error("Error fetching users")
      const users = await response.json()
      set({ users, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  updateUserStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Error updating user status")

      await get().fetchUsers()
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  updateOrderStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Error updating order")

      // Refresh orders after update
      await get().fetchOrders()
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  fetchProformas: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const searchParams = new URLSearchParams()
      if (params.status) searchParams.set("status", params.status)
      if (params.userId) searchParams.set("userId", params.userId)
      if (params.q) searchParams.set("q", params.q)
      if (params.trash) searchParams.set("trash", "1")

      const response = await fetch(`/api/admin/proformas?${searchParams}`)
      if (!response.ok) throw new Error("Error fetching proformas")
      const data = await response.json()
      set({
        proformas: data.proformas,
        proformasTotal: data.total,
        proformasPendientes: data.pendientes,
        proformasCotizadas: data.cotizadas,
        proformasTrashCount: data.trashCount,
        loading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  updateProforma: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/admin/proformas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!response.ok) throw new Error("Error updating proforma")
      await get().fetchProformas()
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  trashProforma: async (id) => {
    const response = await fetch(`/api/admin/proformas/${id}`, { method: "DELETE" })
    if (!response.ok) throw new Error("Error moviendo la proforma a la papelera")
    await get().fetchProformas()
  },

  restoreProforma: async (id) => {
    const response = await fetch(`/api/admin/proformas/${id}/restore`, { method: "POST" })
    if (!response.ok) throw new Error("Error restaurando la proforma")
    await get().fetchProformas({ trash: true })
  },

  deleteProformaPermanently: async (id) => {
    const response = await fetch(`/api/admin/proformas/${id}?permanent=1`, { method: "DELETE" })
    if (!response.ok) throw new Error("Error eliminando la proforma")
    await get().fetchProformas({ trash: true })
  },
}))
