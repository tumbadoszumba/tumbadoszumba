"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
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

/**
 * Sincroniza los filtros con la URL (?category= / ?search=). Vive en su propio
 * componente dentro de Suspense: así el resto de la página, con los productos
 * que llegan del servidor, queda en el HTML inicial sin depender de useSearchParams.
 */
function UrlFilterSync({ initialProducts }: { initialProducts: Product[] }) {
  const searchParams = useSearchParams()
  const { setFilters, fetchProducts, setInitialProducts } = useProductsStore()
  const firstRun = useRef(true)

  // Efecto principal: sincronizar filtros desde la URL y disparar fetchProducts()
  useEffect(() => {
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const isFirstRun = firstRun.current
    firstRun.current = false

    const newFilters: FilterState = {
      categories: category ? [category] : [],
      brands: [],
      priceRange: [0, 10000],
      sortBy: "newest",
      search: search || undefined,
      offersOnly: false,
    }

    setFilters(newFilters)

    // Primera carga sin filtros: la lista ya viene del servidor, no se pide de nuevo
    if (isFirstRun && !category && !search) {
      setInitialProducts(initialProducts)
      return
    }
    fetchProducts(newFilters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return null
}

function ProductsContent({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const { products: storeProducts, productsLoaded, loading, filters, setFilters, fetchProducts, fetchCategories, fetchBrands } = useProductsStore()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  // Antes de la primera respuesta del cliente se muestran los productos del servidor
  const products = productsLoaded ? storeProducts : initialProducts

  // Sincronizar categorías y marcas una sola vez al montar
  useEffect(() => {
    fetchCategories()
    fetchBrands()
  }, [fetchCategories, fetchBrands])

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    const fullFilters: FilterState = { ...newFilters, offersOnly: false }
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
            <BreadcrumbPage>Productos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Results count and controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
            {filters.search ? (
              <>
                <span>
                  Resultados para: <span className="text-primary font-mono">&ldquo;{filters.search}&rdquo;</span>
                </span>
                <button
                  onClick={() => router.push("/products")}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Quitar búsqueda"
                >
                  Limpiar búsqueda
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              "Todos los Productos"
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${products.length} productos encontrados`}
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
              const updated: FilterState = { ...filters, sortBy: sortBy as FilterState["sortBy"], offersOnly: false }
              setFilters(updated)
              fetchProducts(updated)
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} onFiltersChange={handleFiltersChange} />
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
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

export function ProductsPageClient({ initialProducts }: { initialProducts: Product[] }) {
  return <ProductsContent initialProducts={initialProducts} />
}
