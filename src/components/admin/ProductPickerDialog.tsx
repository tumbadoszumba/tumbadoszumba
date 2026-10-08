"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { Search, Plus } from "lucide-react"

interface PickableProduct {
  id: string
  name: string
  price: number
}

interface ProductPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (product: PickableProduct) => void
  onAddBlank: () => void
}

export function ProductPickerDialog({
  open,
  onOpenChange,
  onSelect,
  onAddBlank,
}: ProductPickerDialogProps) {
  const [products, setProducts] = useState<PickableProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    fetch("/api/products?includeAll=true&limit=1000")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const list: PickableProduct[] = (data.products || []).map((p: { id: string; name: string; price: number }) => ({
          id: p.id,
          name: p.name,
          price: p.price,
        }))
        setProducts(list)
      })
      .catch((err) => console.error("Error cargando productos:", err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((p) => p.name.toLowerCase().includes(term))
  }, [products, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Material</DialogTitle>
          <DialogDescription>
            Selecciona un producto existente o agrega un material en blanco.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Cargando productos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No se encontraron productos
            </div>
          ) : (
            filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onSelect(product)
                  onOpenChange(false)
                  setSearch("")
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
              >
                <span className="truncate">{product.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ${formatPrice(product.price)}
                </span>
              </button>
            ))
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onAddBlank()
            onOpenChange(false)
            setSearch("")
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar material en blanco
        </Button>
      </DialogContent>
    </Dialog>
  )
}
