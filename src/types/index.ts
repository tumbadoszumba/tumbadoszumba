export interface Product {
  // Código y modelo del sistema de facturación (los precios internos no van aquí).
  code?: string | null
  model?: string | null
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
  rules?: import("@/lib/calculator-engine").MaterialRules | null
  // Solo en la API pública: enlace al producto de la tienda con el mismo nombre.
  productSlug?: string | null
}

export interface Calculator {
  id: string
  name: string
  slug: string
  description?: string
  inputs: import("@/lib/calculator-templates").CalculatorInput[]
  note?: string | null
  position: number
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
  requestCode?: string | null
  status: ProformaStatus
  source?: "CALCULADORA" | "CARRITO" | "VENDEDOR"
  createdBySellerName?: string | null
  branchId?: string | null
  sellerId?: string | null
  // Solo las proformas de la calculadora tienen área y calculadora.
  area: number | null
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
  calculator: { id: string; name: string } | null
  items: ProformaItem[]
  // Historial: cada PDF generado con datos distintos (la versión es interna).
  versions?: { id: string; version: number; total: number; sellerName: string; branchName: string; createdAt: string }[]
  // null si el cliente pidió la proforma sin iniciar sesión
  user?: { id: string; name: string; email: string; phone?: string | null } | null
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
