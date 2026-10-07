import { cache } from "react"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { transformProduct, transformCategory } from "@/lib/transformers"
import type { Product, Category } from "@/types"

/**
 * Consultas de lectura para las páginas públicas pensadas para buscadores
 * (ficha de producto, categoría, sitemap, llms.txt). Misma estrategia de
 * caché que src/lib/queries.ts: tags "products"/"categories", así el admin
 * invalida al guardar y el `revalidate` es solo una red de seguridad.
 */

const withRelations = { category: true, brand: true } as const

/** Mismo criterio que la tienda pública: solo productos activos y con stock. */
const visible = { isActive: true, stock: { gt: 0 } } as const

/**
 * Producto por slug o id (los dos funcionan, así los enlaces viejos con id
 * siguen vivos). NO filtra por isActive: la página decide si lo indexa.
 */
export const getProductByKey = cache(
  unstable_cache(
    async (key: string): Promise<Product | null> => {
      const product = await prisma.product.findFirst({
        where: { OR: [{ slug: key }, { id: key }] },
        include: withRelations,
      })
      return product ? transformProduct(product) : null
    },
    ["seo-product-by-key"],
    { tags: ["products"], revalidate: 60 }
  )
)

/** Productos activos de la misma categoría (para "Productos relacionados"). */
export const getRelatedProducts = cache(
  unstable_cache(
    async (categorySlug: string, excludeId: string, limit = 4): Promise<Product[]> => {
      const products = await prisma.product.findMany({
        where: { ...visible, category: { slug: categorySlug }, id: { not: excludeId } },
        include: withRelations,
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return products.map(transformProduct)
    },
    ["seo-related-products"],
    { tags: ["products"], revalidate: 60 }
  )
)

/** Categoría por slug con todos sus productos activos. `null` si no existe. */
export const getCategoryWithProducts = cache(
  unstable_cache(
    async (slug: string): Promise<{ category: Category; products: Product[] } | null> => {
      const category = await prisma.category.findUnique({ where: { slug } })
      if (!category) return null
      const products = await prisma.product.findMany({
        where: { categoryId: category.id, ...visible },
        include: withRelations,
        orderBy: { createdAt: "desc" },
      })
      return {
        category: transformCategory(category),
        products: products.map(transformProduct),
      }
    },
    ["seo-category-with-products"],
    { tags: ["products", "categories"], revalidate: 60 }
  )
)

export interface SitemapData {
  products: { slug: string; updatedAt: string; images: string[] }[]
  categories: { slug: string; name: string; updatedAt: string; productCount: number }[]
}

/** Todo lo que necesita el sitemap, en una sola consulta cacheada. */
export const getSitemapData = unstable_cache(
  async (): Promise<SitemapData> => {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: visible,
        select: { slug: true, updatedAt: true, images: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        select: {
          slug: true,
          name: true,
          updatedAt: true,
          _count: { select: { products: { where: visible } } },
        },
      }),
    ])
    return {
      products: products.map((p) => ({
        slug: p.slug,
        updatedAt: p.updatedAt.toISOString(),
        images: p.images,
      })),
      categories: categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        updatedAt: c.updatedAt.toISOString(),
        productCount: c._count.products,
      })),
    }
  },
  ["seo-sitemap-data"],
  { tags: ["products", "categories"], revalidate: 3600 }
)
