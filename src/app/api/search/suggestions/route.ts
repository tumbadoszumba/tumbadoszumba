import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getBestSellingProducts } from "@/lib/queries"
import { transformProduct, transformCategory } from "@/lib/transformers"
import { searchProductIds, normalizeSearch } from "@/lib/search"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim()

    // Si no hay query, devolvemos los productos más buscados/vendidos y categorías populares
    if (!q) {
      const [topProducts, topCategories] = await Promise.all([
        getBestSellingProducts(6),
        prisma.category.findMany({
          include: {
            _count: {
              select: { products: { where: { isActive: true, stock: { gt: 0 } } } },
            },
          },
          take: 6,
          orderBy: {
            products: { _count: "desc" },
          },
        }),
      ])

      return NextResponse.json({
        products: topProducts,
        categories: topCategories.map(transformCategory),
      })
    }

    // Búsqueda en tiempo real cuando el usuario escribe (ver src/lib/search.ts)
    const normalized = normalizeSearch(q)

    const [matchingIds, matchingCategories] = await Promise.all([
      searchProductIds(q, { limit: 6 }),
      // Categorías coincidentes (por nombre o slug, que no lleva tildes)
      prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            ...(normalized ? [{ slug: { contains: normalized.replace(/ /g, "-") } }] : []),
          ],
        },
        include: {
          _count: {
            select: { products: { where: { isActive: true, stock: { gt: 0 } } } },
          },
        },
        take: 4,
      }),
    ])

    // findMany no respeta el orden de "in": se reordena por relevancia.
    const found = matchingIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: matchingIds }, isActive: true, stock: { gt: 0 } },
          include: { category: true, brand: true },
        })
      : []
    const products = matchingIds
      .map((id) => found.find((p) => p.id === id))
      .filter((p): p is (typeof found)[number] => !!p)

    return NextResponse.json({
      products: products.map(transformProduct),
      categories: matchingCategories.map(transformCategory),
    })
  } catch (error) {
    console.error("Error fetching search suggestions:", error)
    return NextResponse.json(
      { error: "Error fetching suggestions" },
      { status: 500 }
    )
  }
}
