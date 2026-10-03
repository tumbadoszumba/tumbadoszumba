"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Search, ShoppingCart, Heart, User, LogOut, Settings, Package, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./ThemeToggle"
import { SearchSuggestionsDropdown } from "./SearchSuggestionsDropdown"
import { useCartStore } from "@/stores/cart-store"
import { useFavoritesStore } from "@/stores/favorites-store"
import { WHATSAPP_URL, socialLinks } from "@/lib/social"
import type { Category, Product } from "@/types"

export function Header({ categories = [] }: { categories?: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([])
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollY = useRef(0)
  const itemCount = useCartStore((state) => state.getItemCount())
  const favoriteCount = useFavoritesStore((state) => state.getItemCount())
  const { data: session, status } = useSession()

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target) &&
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(target)
      ) {
        setIsSuggestionsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cargar sugerencias (populares o coincidentes)
  const fetchSuggestions = useCallback(async (query: string) => {
    setSuggestionsLoading(true)
    try {
      const url = query.trim()
        ? `/api/search/suggestions?q=${encodeURIComponent(query.trim())}`
        : "/api/search/suggestions"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSuggestedProducts(data.products || [])
        setSuggestedCategories(data.categories || [])
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  // Buscar cuando el usuario escribe con debounce
  const handleQueryChange = (val: string) => {
    setSearchQuery(val)
    setIsSuggestionsOpen(true)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val)
    }, 200)
  }

  const handleInputFocus = () => {
    setIsSuggestionsOpen(true)
    if (suggestedProducts.length === 0 && suggestedCategories.length === 0) {
      fetchSuggestions(searchQuery)
    }
  }

  // Sincronizar el input si ya hay un query en la URL
  useEffect(() => {
    const q = searchParams.get("search")
    if (q) {
      setSearchQuery(q)
    } else {
      setSearchQuery("")
    }
  }, [searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSuggestionsOpen(false)
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/products")
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setIsSuggestionsOpen(false)
    if (searchParams.get("search")) {
      router.push("/products")
    }
  }

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    // Only hide after scrolling down past 100px
    if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
      setIsHidden(true)
    } else {
      setIsHidden(false)
    }
    lastScrollY.current = currentScrollY
  }, [])

  useEffect(() => {
    setMounted(true)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ease-in-out ${isHidden ? "-translate-y-full" : "translate-y-0"
        }`}
    >
      <div className="container mx-auto px-4">

        {/* â”€â”€ MAIN HEADER ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="hidden md:flex items-stretch gap-4 py-2">

          {/* Logo — full height, left column */}
          <Link href="/" className="flex items-center shrink-0 self-center" aria-label="TumbadosZumba">
            <Image
              src="/logo-light.png"
              alt="TumbadosZumba"
              width={310}
              height={100}
              className="h-[91px] w-auto object-contain transition-transform hover:scale-105 dark:hidden"
              priority
            />
            <Image
              src="/logo-dark.png"
              alt="TumbadosZumba"
              width={310}
              height={100}
              className="h-[91px] w-auto object-contain transition-transform hover:scale-105 hidden dark:block"
              priority
            />
          </Link>

          {/* Right side: two stacked rows */}
          <div className="flex flex-col flex-1 gap-1 justify-center min-w-0">

            {/* Top row: Search + Actions */}
            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div ref={searchContainerRef} className="flex-1 relative min-w-0">
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
                    <Input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="Buscar productos, materiales, acabados..."
                      className="w-full pl-10 pr-9 h-9 text-sm bg-muted/40 hover:bg-muted/60 focus-visible:bg-background transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </form>
                <SearchSuggestionsDropdown
                  isOpen={isSuggestionsOpen}
                  isLoading={suggestionsLoading}
                  searchQuery={searchQuery}
                  products={suggestedProducts}
                  categories={suggestedCategories}
                  onSelectSuggestion={() => setIsSuggestionsOpen(false)}
                />
              </div>

              {/* Actions: PRODUCTOS | icons | Admin | COTIZAR */}
              <div className="flex items-center gap-1 shrink-0">
                <Link href="/products">
                  <Button variant="ghost" size="sm" className="font-semibold">
                    PRODUCTOS
                  </Button>
                </Link>

                <ThemeToggle />

                <Link href="/profile/favorites">
                  <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Heart className="h-4 w-4" strokeWidth={1.75} />
                    {mounted && favoriteCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white">
                        {favoriteCount > 99 ? "99+" : favoriteCount}
                      </Badge>
                    )}
                    <span className="sr-only">Favoritos</span>
                  </Button>
                </Link>

                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                    {mounted && itemCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center" variant="destructive">
                        {itemCount > 99 ? "99+" : itemCount}
                      </Badge>
                    )}
                    <span className="sr-only">Carrito</span>
                  </Button>
                </Link>

                {/* Auth Section */}
                {mounted && status !== "loading" && (
                  <>
                    {session ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 gap-1.5 px-2.5">
                            <User className="h-4 w-4" strokeWidth={1.75} />
                            <span className="max-w-36 truncate text-sm font-medium" translate="no">
                              {session.user?.name?.split(" ")[0]}
                            </span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>
                            <div className="flex flex-col" translate="no">
                              <span className="font-medium">{session.user?.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {session.user?.email}
                              </span>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer">
                              <User className="mr-2 h-4 w-4" strokeWidth={1.75} />
                              Mi Perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile/orders" className="cursor-pointer">
                              <Package className="mr-2 h-4 w-4" strokeWidth={1.75} />
                              Mis Pedidos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/profile/settings" className="cursor-pointer">
                              <Settings className="mr-2 h-4 w-4" strokeWidth={1.75} />
                              Configuración
                            </Link>
                          </DropdownMenuItem>
                          {session.user?.role === "ADMIN" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href="/admin" className="cursor-pointer">
                                  <Settings className="mr-2 h-4 w-4" strokeWidth={1.75} />
                                  Panel de administración
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
                            Cerrar Sesión
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link href="/login">
                          <Button variant="ghost" size="sm">Ingresar</Button>
                        </Link>
                        <Link href="/register">
                          <Button size="sm">Registrarse</Button>
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {/* COTIZAR CTA */}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-base text-white transition-all hover:brightness-110 hover:shadow-lg active:scale-95 shrink-0"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                    {socialLinks[0].icon}
                  </svg>
                  COTIZAR
                </a>
              </div>
            </div>

            {/* Bottom row: Nav links */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300 overflow-x-auto scrollbar-none">
              {/* Ver Categorías Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors py-0.5 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                    <Package className="h-4 w-4 text-primary" strokeWidth={1.75} />
                    <span>Ver categorías</span>
                    <ChevronDown className="h-3 w-3 text-slate-500" strokeWidth={1.75} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60 max-h-[420px] overflow-y-auto">
                  <DropdownMenuLabel className="text-xs font-bold text-slate-500">Categorías</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.length === 0 ? (
                    <div className="py-3 px-3 text-xs text-muted-foreground text-center">Cargando categorías...</div>
                  ) : (
                    categories.map((category) => (
                      <DropdownMenuItem key={category.id || category.slug} asChild>
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="cursor-pointer font-medium flex items-center justify-between"
                        >
                          <span className="truncate">{category.name}</span>
                          {category.productCount !== undefined && category.productCount > 0 && (
                            <span className="text-[10px] text-muted-foreground ml-2 font-mono">{category.productCount}</span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/products" className="cursor-pointer font-semibold text-primary justify-center text-xs">
                      Ver todos los productos
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/instalaciones" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors shrink-0">
                <Settings className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
                <span>Instalaciones</span>
              </Link>

              <Link href="/ofertas" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors shrink-0">
                <Heart className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
                <span>Ofertas</span>
              </Link>

              <Link href="/diseno-e-ideas" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors shrink-0">
                <User className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
                <span className="font-semibold text-slate-900 dark:text-white">Ideas de diseño+</span>
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase leading-none">
                  Nuevo
                </span>
              </Link>
            </div>

          </div>
        </div>

        {/* ── MOBILE HEADER ────────────────────────────────────────── */}
        {/* Cuenta | Logo centrado | Contáctanos (estilo app) */}
        <div className="grid md:hidden grid-cols-[4.5rem_1fr_4.5rem] h-14 items-center">
          <Link
            href={session ? "/profile" : "/login"}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <User className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <span className="max-w-full truncate" translate="no">
              {mounted && session ? session.user?.name?.split(" ")[0] : "Cuenta"}
            </span>
          </Link>

          <Link href="/" className="flex items-center justify-center" aria-label="TumbadosZumba">
            <Image
              src="/logo-light.png"
              alt="TumbadosZumba"
              width={130}
              height={44}
              className="h-10 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/logo-dark.png"
              alt="TumbadosZumba"
              width={130}
              height={44}
              className="h-10 w-auto object-contain hidden dark:block"
              priority
            />
          </Link>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-[#25D366] transition-opacity hover:opacity-80"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden>
              {socialLinks[0].icon}
            </svg>
            <span>Contáctanos</span>
          </a>
        </div>

        {/* Mobile Search Bar (siempre visible) */}
        <div ref={mobileSearchContainerRef} className="pb-3 md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Buscar productos, materiales..."
              className="w-full pl-10 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </form>
          <SearchSuggestionsDropdown
            isOpen={isSuggestionsOpen}
            isLoading={suggestionsLoading}
            searchQuery={searchQuery}
            products={suggestedProducts}
            categories={suggestedCategories}
            onSelectSuggestion={() => setIsSuggestionsOpen(false)}
          />
        </div>

      </div>
    </header>
  )
}
