"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  CreditCard,
  Users,
  Settings,
  Store,
  Tag,
  FileText,
  MessageSquare,
  Calculator,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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

export function AdminMobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    fetch("/api/messages?unread=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUnreadCount(data.unreadCount || 0))
      .catch(() => {})
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Image
              src="/iconozumba.png"
              alt="Tumbados Zumba"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
            Admin Panel
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.badgeKey === "messages" && unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center size-5 text-[11px] font-bold rounded-full bg-brand-orange text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <Button asChild variant="outline" className="w-full justify-start" onClick={() => setOpen(false)}>
            <Link href="/">
              <Store className="mr-2 h-4 w-4" />
              Volver a la Tienda
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
