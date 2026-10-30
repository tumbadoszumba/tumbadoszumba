"use client"

import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { FilterSidebar } from "./FilterSidebar"
import { FilterState } from "@/types"

interface FilterMobileProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  activeFilterCount: number
}

export function FilterMobile({
  filters,
  onFiltersChange,
  activeFilterCount,
}: FilterMobileProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="h-dvh w-[88vw] max-w-[360px] gap-0 p-0 sm:max-w-[360px]">
        <SheetHeader className="flex-shrink-0 border-b px-5 py-4 pr-12 text-left">
          <SheetTitle className="text-lg">Filtros</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <FilterSidebar filters={filters} onFiltersChange={onFiltersChange} showTitle={false} />
        </div>
        <div className="flex-shrink-0 border-t px-5 py-3">
          <SheetClose asChild>
            <Button className="w-full">Ver resultados</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
