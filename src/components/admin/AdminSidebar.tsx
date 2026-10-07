"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  Store,
  Tag,
  MessageSquare,
  Calculator,
  ImageIcon,
  FileText,
} from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Mensajes", href: "/admin/messages", icon: MessageSquare, badgeKey: "messages" },
  { name: "Productos", href: "/admin/products", icon: Package },
  { name: "Categorias", href: "/admin/categories", icon: FolderTree },
  { name: "Marcas", href: "/admin/brands", icon: Tag },
  { name: "Calculadoras", href: "/admin/calculators", icon: Calculator },
  { name: "Proformas", href: "/admin/proformas", icon: FileText },
  { name: "Media", href: "/admin/media", icon: ImageIcon },
  { name: "Ordenes", href: "/admin/orders", icon: ShoppingCart },
  { name: "Pagos", href: "/admin/payments", icon: CreditCard },
  { name: "Usuarios", href: "/admin/users", icon: Users },
  { name: "Configuracion", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const res = await fetch("/api/messages?unread=true")
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (e) {
        console.error("Error al cargar mensajes no leídos:", e)
      }
    }
    loadUnreadCount()
  }, [pathname])

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Image
          src="/iconozumba.png"
          alt="Tumbados Zumba"
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg object-contain"
        />
        <span className="font-bold">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{item.name}</span>
              </div>
              {item.badgeKey === "messages" && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center size-5 text-[11px] font-bold rounded-full bg-brand-orange text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Back to Store */}
      <div className="border-t p-4">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/">
            <Store className="mr-2 h-4 w-4" />
            Volver a la Tienda
          </Link>
        </Button>
      </div>
    </aside>
  )
}
