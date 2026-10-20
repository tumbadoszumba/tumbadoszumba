"use client"

import * as React from "react"
import Link from "next/link"
import { User, Heart, Package, Building2, PanelTop, Layers, Grid3x3, Frame, LayoutDashboard, Lightbulb, RectangleHorizontal, Wrench } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { socialLinks } from "@/lib/social"
import { categoryPath } from "@/lib/site"
import type { Category } from "@/types"

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Building2,
  PanelTop,
  Layers,
  Grid3x3,
  Frame,
  LayoutDashboard,
  Lightbulb,
  RectangleHorizontal,
  Wrench,
  Package,
}

interface MobileNavProps {
  categories?: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

// El botón que lo abre es "Menú" en la barra inferior (MobileBottomNav)
export function MobileNav({ categories = [], open, onOpenChange: setOpen }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          {/* User Actions */}
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <User className="h-4 w-4" strokeWidth={1.75} />
              Mi Cuenta
            </Link>
            <Link
              href="/profile/favorites"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <Heart className="h-4 w-4" strokeWidth={1.75} />
              Favoritos
            </Link>
            <Link
              href="/profile/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <Package className="h-4 w-4" strokeWidth={1.75} />
              Mis Pedidos
            </Link>
          </div>

          <Separator />

          {/* Categories */}
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground mb-1">
              Categorías
            </p>
            {categories.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Cargando categorías...</p>
            ) : (
              categories.map((category) => {
                const IconComponent = (category.icon && iconMap[category.icon]) || Package
                return (
                  <Link
                    key={category.id || category.slug}
                    href={categoryPath(category.slug)}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" strokeWidth={1.75} />
                      <span>{category.name}</span>
                    </div>
                    {category.productCount !== undefined && category.productCount > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {category.productCount}
                      </span>
                    )}
                  </Link>
                )
              })
            )}
          </div>

          <Separator />

          {/* All Products & Offers */}
          <div className="flex flex-col gap-2">
            <Link
              href="/ofertas"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Heart className="h-4 w-4" strokeWidth={1.75} />
              Ver Productos en Oferta
            </Link>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver Todos los Productos
            </Link>
          </div>

          <Separator />

          {/* Redes sociales: en celular reemplazan a los botones flotantes */}
          <div className="flex items-center justify-center gap-3 pb-4">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                title={link.label}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110",
                  link.className
                )}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                  {link.icon}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
