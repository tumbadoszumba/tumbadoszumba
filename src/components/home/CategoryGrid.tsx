import Link from "next/link"
import { Search, TrendingUp } from "lucide-react"
import { formatPrice } from "@/lib/format"

interface PopularProduct {
  id: string
  name: string
  slug: string
  price: number
  showPrice?: boolean
}

export function CategoryGrid({ products }: { products: PopularProduct[] }) {
  const topProducts = products.slice(0, 4)

  return (
    <section className="pt-1 pb-0.5 sm:pt-1 sm:pb-0.5">
      <div className="container mx-auto px-4">
        {/* Title row */}
        <div className="mb-0.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3 text-brand-orange" strokeWidth={1.75} />
            <h2 className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-400">
              Productos más buscados
            </h2>
          </div>
        </div>

        {/* Pills de productos más buscados (primeros 4, sin scrollbar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {topProducts.length === 0
            ? (
                <div className="text-[10px] text-muted-foreground py-0.5">
                  No hay productos disponibles actualmente
                </div>
              )
            : topProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-2 py-[2px] text-[10px] font-medium text-slate-600 dark:text-slate-300 transition-all hover:border-brand-orange hover:text-brand-orange hover:shadow-xs"
                >
                  <Search className="size-2.5 text-slate-400 group-hover:text-brand-orange transition-colors shrink-0" strokeWidth={1.75} />
                  <span className="leading-tight">{product.name}</span>
                  {product.showPrice !== false && product.price > 0 && (
                    <span className="text-[9px] font-mono font-semibold text-brand-navy dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0 rounded-full leading-tight">
                      ${formatPrice(Number(product.price))}
                    </span>
                  )}
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
