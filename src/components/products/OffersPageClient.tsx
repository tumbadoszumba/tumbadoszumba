"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FilterSidebar } from "@/components/products/FilterSidebar"
import { FilterMobile } from "@/components/products/FilterMobile"
import { ProductGrid } from "@/components/products/ProductGrid"
import { SortSelect } from "@/components/products/SortSelect"
import { useProductsStore } from "@/stores/products-store"
import { FilterState, Product } from "@/types"
import { Tag } from "lucide-react"

/**
 * Sincroniza los filtros con la URL. Va en su propio componente dentro de
 * Suspense para que el resto de la página (con los productos del servidor)
 * quede en el HTML inicial.
 */
function UrlFilterSync({ initialProducts }: { initialProducts: Product[] }) {
  const searchParams = useSearchParams()
  const { setFilters, fetchProducts, setInitialProducts } = useProductsStore()
  const firstRun = useRef(true)

  // Efecto principal: sincronizar filtros desde la URL y disparar fetchProducts()
  useEffect(() => {
    const category = searchParams.get("category")
    const brand = searchParams.get("brand")
    const isFirstRun = firstRun.current
    firstRun.current = false

    const newFilters: FilterState = {
      categories: category ? [category] : [],
      brands: brand ? [brand] : [],
      priceRange: [0, 10000],
      sortBy: "newest",
      offersOnly: true,
      search: undefined,
    }

    setFilters(newFilters)

    // Primera carga sin filtros: la lista de ofertas ya viene del servidor
    if (isFirstRun && !category && !brand) {
      setInitialProducts(initialProducts)
      return
    }
    fetchProducts(newFilters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return null
}

function OffersContent({ initialProducts }: { initialProducts: Product[] }) {
  const { products: storeProducts, productsLoaded, loading, filters, setFilters, fetchProducts, fetchCategories, fetchBrands } = useProductsStore()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  // Antes de la primera respuesta del cliente se muestran las ofertas del servidor
  const products = productsLoaded ? storeProducts : initialProducts

  // Sincronizar categorías y marcas una sola vez al montar
  useEffect(() => {
    fetchCategories()
    fetchBrands()
  }, [fetchCategories, fetchBrands])

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    const fullFilters: FilterState = { ...newFilters, offersOnly: true }
    setFilters(fullFilters)
    fetchProducts(fullFilters)
  }, [setFilters, fetchProducts])

  const activeFilterCount =
    filters.brands.length +
    filters.categories.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ? 1 : 0)

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={null}>
        <UrlFilterSync initialProducts={initialProducts} />
      </Suspense>

      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Productos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ofertas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main content */}
      <div className="flex gap-8 lg:h-[calc(100dvh-14rem)] lg:overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 overflow-y-auto overscroll-contain pr-2 lg:block" style={{ scrollbarWidth: "thin" }}>
          <div className="flex flex-col">
            <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} />
          </div>
        </aside>

        {/* Products */}
        <div className="min-w-0 flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2" style={{ scrollbarWidth: "thin" }}>
          {/* Results count and controls */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Productos de Oferta</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-xs font-semibold text-brand-orange">
                  <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Descuentos
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? "Cargando..." : `${products.length} productos en oferta encontrados`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <FilterMobile
                filters={filters}
                onFiltersChange={handleFiltersChange}
                activeFilterCount={activeFilterCount}
              />
              <SortSelect
                value={filters.sortBy}
                onChange={(sortBy) => {
                  const updated: FilterState = { ...filters, sortBy: sortBy as FilterState["sortBy"], offersOnly: true }
                  setFilters(updated)
                  fetchProducts(updated)
                }}
              />
            </div>
          </div>

          <ProductGrid
            products={products}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

export function OffersPageClient({ initialProducts }: { initialProducts: Product[] }) {
  return <OffersContent initialProducts={initialProducts} />
}
