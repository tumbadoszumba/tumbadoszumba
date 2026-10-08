"use client"

import Link from "next/link"
import Image from "next/image"
import { TrendingUp, Package, ArrowRight } from "lucide-react"
import type { Product, Category } from "@/types"
import { formatPrice } from "@/lib/format"

interface SearchSuggestionsDropdownProps {
  isOpen: boolean
  isLoading: boolean
  searchQuery: string
  products: Product[]
  categories: Category[]
  onSelectSuggestion: () => void
}

export function SearchSuggestionsDropdown({
  isOpen,
  isLoading,
  searchQuery,
  products,
  categories,
  onSelectSuggestion,
}: SearchSuggestionsDropdownProps) {
  if (!isOpen) return null

  const isInitial = !searchQuery.trim()

  return (
    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
      <div className="max-h-[70vh] overflow-y-auto p-3 space-y-4 divide-y divide-border/40">
        {/* Categorías Sugeridas */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <Package className="h-3.5 w-3.5 text-brand-orange" strokeWidth={1.75} />
              <span>Categorías</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/products?category=${cat.slug}`}
                  onClick={onSelectSuggestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/60 hover:bg-brand-orange hover:text-white transition-colors duration-150 border border-border/40"
                >
                  <span>{cat.name}</span>
                  {cat.productCount > 0 && (
                    <span className="text-[10px] opacity-75 font-mono">
                      ({cat.productCount})
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Productos Más Buscados / Coincidentes */}
        <div className={categories.length > 0 ? "pt-3 space-y-2" : "space-y-2"}>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-brand-orange" strokeWidth={1.75} />
              <span>{isInitial ? "Productos más buscados" : "Sugerencias de productos"}</span>
            </div>
            {isLoading && <span className="text-[10px] lowercase text-muted-foreground animate-pulse">Buscando...</span>}
          </div>

          {products.length === 0 && !isLoading ? (
            <p className="text-xs text-muted-foreground py-3 text-center">
              No se encontraron coincidencias directas.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={onSelectSuggestion}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors border border-transparent hover:border-border/40 group"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted/30 border border-border/40">
                    {product.images && product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="44px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate group-hover:text-brand-orange transition-colors">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-bold text-foreground">
                        ${formatPrice(Number(product.price))}
                      </span>
                      {product.brand && (
                        <span className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                          {product.brand}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ver todos los resultados si hay término de búsqueda */}
        {!isInitial && (
          <div className="pt-2">
            <Link
              href={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
              onClick={onSelectSuggestion}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-brand-orange hover:bg-brand-orange/10 transition-colors"
            >
              <span>Ver todos los resultados para &ldquo;{searchQuery}&rdquo;</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
