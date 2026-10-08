"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart, Star, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Product } from "@/types"
import { useCartStore } from "@/stores/cart-store"
import { useFavoritesStore } from "@/stores/favorites-store"
import { formatPrice } from "@/lib/format"

interface ProductCardProps {
  product: Product
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=400&h=400&fit=crop"

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)

  // La lista de favoritos vive en localStorage (Zustand persist), que no
  // existe durante el render en el servidor. Hasta que el componente monte
  // en el cliente tratamos todo como "no favorito" para que coincida con el
  // HTML que llegó del servidor y evitar un hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const toggleFavorite = useFavoritesStore((state) => state.toggleItem)
  const isFavoriteInStore = useFavoritesStore((state) => state.isFavorite(product.id))
  const isFavorite = mounted && isFavoriteInStore

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product)
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  const productImage = product.images?.[0] || PLACEHOLDER_IMAGE

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md border-slate-200 dark:border-slate-800">
      <div className="relative aspect-square overflow-hidden bg-white">
        {/* Badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground">Nuevo</Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive">-{discountPercent}%</Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className={`absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/80 transition-opacity ${
            isFavorite ? 'opacity-100 text-red-500' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          <span className="sr-only">Agregar a favoritos</span>
        </Button>

        {/* Image */}
        <Link href={`/products/${product.slug}`}>
          <div className="relative h-full w-full">
            <Image
              src={productImage}
              alt={product.name}
              fill
              className="object-contain transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        </Link>

        {/* Quick Add Button */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex opacity-100 pointer-events-auto transition-all lg:translate-y-full lg:opacity-0 lg:pointer-events-none lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto">
          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            variant={added ? "secondary" : "default"}
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Agregado
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Agregar
              </>
            )}
          </Button>
        </div>
      </div>

      <CardContent className="p-2.5 sm:p-3">
        {/* Brand */}
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{product.brand}</p>

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-0.5 text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mt-1 flex items-center gap-0.5">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-muted-foreground">{product.rating}</span>
        </div>

        {/* Price */}
        <div className="mt-1 flex items-baseline gap-1.5">
          {product.showPrice !== false ? (
            <>
              <span className="text-base font-bold text-foreground">
                ${formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  ${formatPrice(product.originalPrice!)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-500">
              Precio por confirmar
            </span>
          )}
        </div>

        {/* Stock */}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {product.stock > 0 ? (
            <span className="text-green-600 dark:text-green-400">
              {product.stock} disponibles
            </span>
          ) : (
            <span className="text-destructive">Agotado</span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
