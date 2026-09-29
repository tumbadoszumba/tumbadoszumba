export interface Product {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  categoryId?: string
  brandId?: string
  isActive?: boolean
  price: number
  originalPrice?: number
  images: string[]
  description: string
  specs: Record<string, string>
  stock: number
  isNew: boolean
  isFeatured: boolean
  rating: number
  freeShipping?: boolean
  returnPolicy?: boolean
  returnDays?: number | null
  warranty?: boolean
  warrantyPeriod?: string | null
  showPrice?: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  productCount: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
  productCount: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface FilterState {
  categories: string[]
  brands: string[]
  priceRange: [number, number]
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'newest' | 'rating'
  offersOnly?: boolean
  search?: string
}

export interface CalculatorMaterial {
  id: string
  name: string
  unit: string
  yield: number
  position: number
  unitPrice?: number | null
}

export interface Calculator {
  id: string
  name: string
  slug: string
  description?: string
  area: number
  isActive: boolean
  materials: CalculatorMaterial[]
}

export type ProformaStatus = 'PENDIENTE' | 'COTIZADA' | 'ENVIADA'
export type ProformaAdjustmentType = 'percentage' | 'fixed'
export type ProformaAdjustmentDirection = 'increase' | 'decrease'

export interface ProformaItem {
  id: string
  name: string
  unit: string
  quantity: number
  originalQuantity?: number
  unitPrice?: number | null
  originalUnitPrice?: number | null
  position?: number
  total?: number
  originalTotal?: number
}

export interface Proforma {
  id: string
  status: ProformaStatus
  area: number
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  contactDocument?: string | null
  proformaNumber?: number | null
  branchName?: string | null
  sellerName?: string | null
  createdAt: string
  deletedAt?: string | null
  adjustmentType?: ProformaAdjustmentType | null
  adjustmentDirection?: ProformaAdjustmentDirection | null
  adjustmentValue?: number | null
  calculator: { id: string; name: string }
  items: ProformaItem[]
  user?: { id: string; name: string; email: string; phone?: string | null }
  itemsTotal?: number
  originalTotal?: number
  adjustmentAmount?: number
  total?: number
}

export interface Seller {
  id: string
  name: string
  active: boolean
  branchId: string
}

export interface Branch {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  active: boolean
  sellers: Seller[]
}
