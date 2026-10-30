"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useProductsStore } from "@/stores/products-store"

interface CategoryFilterProps {
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
}

export function CategoryFilter({
  selectedCategories,
  onCategoriesChange,
}: CategoryFilterProps) {
  const { categories } = useProductsStore()
  const [isOpen, setIsOpen] = useState(true)

  const handleCategoryToggle = (categorySlug: string) => {
    if (selectedCategories.includes(categorySlug)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== categorySlug))
    } else {
      onCategoriesChange([...selectedCategories, categorySlug])
    }
  }

  return (
    <div className="flex min-h-0 flex-col border-b pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 font-medium"
      >
        Categoria
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 min-h-24 max-h-48 space-y-2 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No hay categorías disponibles</p>
          ) : (
            categories.map((category) => {
              const isChecked = selectedCategories.some(
                (c) =>
                  c.toLowerCase() === category.slug.toLowerCase() ||
                  c.toLowerCase() === category.name.toLowerCase()
              )
              return (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={isChecked}
                    onCheckedChange={() => handleCategoryToggle(category.slug)}
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.productCount}
                    </span>
                  </Label>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
