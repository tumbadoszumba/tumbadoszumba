import { cache } from "react"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { transformProduct, transformCategory, transformBrand } from "@/lib/transformers"
import { getSoldQuantityByProduct } from "@/lib/sales"
import type { Product, Category, Brand } from "@/types"

/**
 * Consultas de lectura para Server Components.
 *
 * Se usan directamente desde el servidor (sin pasar por /api/*), así que la
 * página no tiene que esperar a hidratar para pedir datos.
 *
 * Cada una tiene dos capas de caché:
 * - `unstable_cache` con tags ("products", "categories", "brands"): el
 *   resultado se reutiliza ENTRE peticiones sin volver a tocar Supabase.
 *   Cuando el admin crea/edita/borra algo, la ruta correspondiente llama a
 *   `revalidateTag()` (ver src/lib/cache-tags.ts) y la próxima visita ya
 *   trae el dato actualizado al instante. El `revalidate: 60` es solo una
 *   red de seguridad por si algún flujo de escritura no invalidara el tag.
 * - `cache()` de React por encima: dedupe DENTRO de la misma petición. Por
 *   ejemplo getBestSellingProducts(6) se llama tanto en el layout (Footer)
 *   como en la home (CategoryGrid) — sin esto, ambas podrían disparar la
 *   consulta a la vez si el caché aún no estaba poblado.
 */

const withRelations = { category: true, brand: true } as const

/** Productos marcados como destacados. */
export const getFeaturedProducts = cache(
  unstable_cache(
    async (limit = 8): Promise<Product[]> => {
      const products = await prisma.product.findMany({
        where: { isActive: true, isFeatured: true, stock: { gt: 0 } },
        orderBy: { createdAt: "desc" },
        include: withRelations,
        take: limit,
      })
      return products.map(transformProduct)
    },
    ["featured-products"],
    { tags: ["products"], revalidate: 60 }
  )
)

/** Productos con precio de comparación, es decir, en oferta. */
export const getOfferProducts = cache(
  unstable_cache(
    async (limit = 12): Promise<Product[]> => {
      const products = await prisma.product.findMany({
        where: { isActive: true, comparePrice: { not: null, gt: 0 }, stock: { gt: 0 } },
        orderBy: { createdAt: "desc" },
        include: withRelations,
        take: limit,
      })
      return products.map(transformProduct)
    },
    ["offer-products"],
    { tags: ["products"], revalidate: 60 }
  )
)

/**
 * Listado completo de la tienda (mismo criterio que /api/products sin filtros,
 * orden más nuevo primero). Sirve para que /products y /ofertas traigan los
 * productos en el HTML; el filtrado en el navegador sigue igual.
 */
export const getListedProducts = cache(
  unstable_cache(
    async (offersOnly: boolean): Promise<Product[]> => {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          stock: { gt: 0 },
          ...(offersOnly ? { comparePrice: { not: null, gt: 0 } } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: withRelations,
      })
      return products.map(transformProduct)
    },
    ["listed-products"],
    { tags: ["products"], revalidate: 60 }
  )
)

/**
 * "Más vendidos": unidades vendidas reales (OrderItem de pedidos ya
 * confirmados/pagados, ver src/lib/sales.ts), de mayor a menor. Si la
 * tienda todavía no tiene suficiente historial de ventas para llenar
 * `limit`, se completa con los productos más recientes para no dejar la
 * sección vacía o a medias.
 */
export const getBestSellingProducts = cache(
  unstable_cache(
    async (limit = 6): Promise<Product[]> => {
      const activeProducts = await prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0 } },
        include: withRelations,
        orderBy: { createdAt: "desc" },
      })

      const soldByProduct = await getSoldQuantityByProduct(
        activeProducts.map((p) => p.id)
      )

      const bySales = activeProducts
        .filter((p) => (soldByProduct.get(p.id) ?? 0) > 0)
        .sort((a, b) => (soldByProduct.get(b.id) ?? 0) - (soldByProduct.get(a.id) ?? 0))

      const top = bySales.slice(0, limit)

      // Completar con los más recientes que no hayan entrado ya por ventas
      if (top.length < limit) {
        const usedIds = new Set(top.map((p) => p.id))
        for (const product of activeProducts) {
          if (top.length >= limit) break
          if (usedIds.has(product.id)) continue
          top.push(product)
        }
      }

      return top.map(transformProduct)
    },
    ["best-selling-products"],
    { tags: ["products"], revalidate: 60 }
  )
)

/** Todas las categorías con su número de productos activos. */
export const getCategories = cache(
  unstable_cache(
    async (): Promise<Category[]> => {
      const categories = await prisma.category.findMany({
        include: {
          _count: { select: { products: { where: { isActive: true, stock: { gt: 0 } } } } },
        },
        orderBy: { name: "asc" },
      })
      return categories.map(transformCategory)
    },
    ["categories"],
    // El conteo de productos por categoría depende también de "products"
    { tags: ["categories", "products"], revalidate: 60 }
  )
)

/** Todas las marcas con su número de productos activos. */
export const getBrands = cache(
  unstable_cache(
    async (): Promise<Brand[]> => {
      const brands = await prisma.brand.findMany({
        include: {
          _count: { select: { products: { where: { isActive: true, stock: { gt: 0 } } } } },
        },
        orderBy: { name: "asc" },
      })
      return brands.map(transformBrand)
    },
    ["brands"],
    // El conteo de productos por marca depende también de "products"
    { tags: ["brands", "products"], revalidate: 60 }
  )
)
