"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Heart, ChevronRight } from "lucide-react"
import { Product } from "@/types"
import { useFavoritesStore } from "@/stores/favorites-store"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/format"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=400&h=400&fit=crop"

/** Fin de la promo: domingo de esta semana a las 23:59:59 */
function getDeadline() {
  const now = new Date()
  const end = new Date(now)
  end.setDate(now.getDate() + ((7 - now.getDay()) % 7))
  end.setHours(23, 59, 59, 999)
  if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 7)
  return end
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function useCountdown() {
  // null hasta montar, para evitar desajustes de hidratación
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    const deadline = getDeadline()
    const tick = () => {
      const diff = Math.max(0, deadline.getTime() - Date.now())
      const totalSeconds = Math.floor(diff / 1000)
      setLeft({
        d: Math.floor(totalSeconds / 86400),
        h: Math.floor((totalSeconds % 86400) / 3600),
        m: Math.floor((totalSeconds % 3600) / 60),
        s: totalSeconds % 60,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return left
}

function CountdownBox({ value }: { value: string }) {
  return (
    <span className="min-w-8 rounded-md bg-[#D93025] px-1.5 py-1 text-center text-xs font-bold tabular-nums text-white">
      {value}
    </span>
  )
}

function OfferCard({ product }: { product: Product }) {
  // La lista de favoritos vive en localStorage (Zustand persist), que no
  // existe durante el render en el servidor. Hasta que el componente monte
  // en el cliente tratamos todo como "no favorito" para que coincida con el
  // HTML que llegó del servidor y evitar un hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const toggleFavorite = useFavoritesStore((state) => state.toggleItem)
  const isFavoriteInStore = useFavoritesStore((state) => state.isFavorite(product.id))
  const isFavorite = mounted && isFavoriteInStore

  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price
  const discount = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  const [intPart, decPart] = formatPrice(product.price).split(".")
  const tag =
    product.stock > 0 && product.stock <= 10
      ? "POCAS UNIDADES"
      : discount >= 20
      ? "TIEMPO LIMITADO"
      : null

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative w-[152px] sm:w-[180px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
        {discount > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{discount}% OFF
          </span>
        )}
        <button
          type="button"
          aria-label="Agregar a favoritos"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite(product)
          }}
          className={`absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm transition-colors hover:bg-white dark:bg-slate-900/80 ${
            isFavorite ? "text-red-500" : "text-slate-500"
          }`}
        >
          <Heart className={`size-3.5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
        <Image
          src={product.images?.[0] || PLACEHOLDER_IMAGE}
          alt={product.name}
          fill
          sizes="180px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-2.5">
        <h3 className="line-clamp-2 h-8 text-xs font-medium leading-tight text-slate-800 dark:text-slate-200">
          {product.name}
        </h3>

        <div className="mt-1.5 flex min-h-4 items-center justify-between gap-1">
          {hasDiscount && product.showPrice !== false ? (
            <span className="text-[11px] text-muted-foreground line-through">
              ${formatPrice(product.originalPrice!)}
            </span>
          ) : (
            <span />
          )}
          {tag && (
            <span className="rounded-sm bg-[#D93025] px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white">
              {tag}
            </span>
          )}
        </div>

        <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
          {product.showPrice !== false ? (
            <>
              <span className="text-lg">${intPart}</span>
              <sup className="text-[11px]">{decPart}</sup>
            </>
          ) : (
            <span className="text-[13px]">Oferta</span>
          )}
        </p>

        {product.freeShipping && (
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
            Envío gratis
          </p>
        )}
      </div>
    </Link>
  )
}

export function FlashOffers({ products }: { products: Product[] }) {
  const left = useCountdown()

  // Sin ofertas cargadas: no ocupamos espacio en la home
  if (products.length === 0) return null

  const maxDiscount = products.reduce((max, p) => {
    if (!p.originalPrice || p.originalPrice <= p.price) return max
    return Math.max(max, Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100))
  }, 0)

  return (
    <section className="py-3 sm:py-4">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Cabecera con contador */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 sm:px-4 dark:border-slate-800">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-[#D93025] sm:text-base">
                <Clock className="size-4 shrink-0" strokeWidth={2.25} />
                OFERTAS FLASH
              </span>
              <span className="hidden truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
                Los mejores precios
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="hidden text-xs text-muted-foreground sm:inline">Termina en:</span>
              {left ? (
                <div className="flex items-center gap-1">
                  <CountdownBox value={`${pad(left.d)}d`} />
                  <CountdownBox value={pad(left.h)} />
                  <CountdownBox value={pad(left.m)} />
                  <CountdownBox value={pad(left.s)} />
                </div>
              ) : (
                <Skeleton className="h-6 w-32 rounded-md" />
              )}
            </div>
          </div>

          {/* Panel promocional + carrusel de ofertas */}
          <div className="flex">
            <div
              className="relative hidden w-[180px] shrink-0 flex-col items-center justify-center overflow-hidden px-3 text-center md:flex lg:w-[210px]"
              style={{
                background:
                  "radial-gradient(circle at 50% 125%, #5b1220 0%, #191c26 55%, #0b0d14 100%)",
              }}
            >
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#F04438] uppercase">
                APRESÚRATE
              </span>
              <span className="mt-1.5 text-[11px] font-medium leading-tight text-white/80">
                Puedes conseguir hasta
              </span>
              <span className="mt-0.5 text-5xl font-extrabold leading-none text-white lg:text-6xl">
                {maxDiscount || 30}%
              </span>
              <span className="mt-1 text-[11px] font-bold tracking-wider text-white/90 uppercase">
                DE DESCUENTO
              </span>
              <span className="mt-1 text-[9px] font-medium tracking-[0.2em] text-white/45">
                POR TIEMPO LIMITADO
              </span>
              <span
                className="mt-4 text-4xl font-extrabold tracking-tight lg:text-5xl"
                style={{ color: "transparent", WebkitTextStroke: "1.5px #F04438" }}
              >
                HOT
              </span>
              <Link
                href="/ofertas"
                className="mt-4 inline-flex items-center gap-0.5 text-[11px] font-semibold text-white/70 transition-colors hover:text-white"
              >
                Ver todas <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="min-w-0 flex-1 overflow-x-auto p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3">
                {products.map((product) => (
                  <OfferCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
