"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandFilter } from "./BrandFilter"
import { PriceFilter } from "./PriceFilter"
import { CategoryFilter } from "./CategoryFilter"
import { FilterState } from "@/types"

interface FilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  /** false cuando el contenedor (el panel del celular) ya muestra su propio título */
  showTitle?: boolean
}

export function FilterSidebar({ filters, onFiltersChange, showTitle = true }: FilterSidebarProps) {
  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 10000

  const handleClearFilters = () => {
    onFiltersChange({
      brands: [],
      categories: [],
      priceRange: [0, 10000],
      sortBy: filters.sortBy,
      offersOnly: filters.offersOnly,
      search: filters.search,
    })
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className={showTitle ? "flex items-center justify-between" : "flex items-center justify-end"}>
        {showTitle && <h2 className="text-lg font-semibold">Filtros</h2>}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-0 text-sm text-primary hover:text-primary/80"
          >
            Limpiar
            <X className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      <BrandFilter
        selectedBrands={filters.brands}
        onBrandsChange={(brands) =>
          onFiltersChange({ ...filters, brands })
        }
      />

      <PriceFilter
        priceRange={filters.priceRange}
        onPriceChange={(priceRange) =>
          onFiltersChange({ ...filters, priceRange })
        }
      />

      <CategoryFilter
        selectedCategories={filters.categories}
        onCategoriesChange={(categories) =>
          onFiltersChange({ ...filters, categories })
        }
      />
    </div>
  )
}
