import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformProduct } from "@/lib/transformers"
import { invalidateProducts } from "@/lib/cache-tags"
import { getSoldQuantityByProduct } from "@/lib/sales"
import { searchProductIds } from "@/lib/search"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Query params
    const category = searchParams.get("category")
    const brand = searchParams.get("brand")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sortBy = searchParams.get("sortBy") || "newest"
    const featured = searchParams.get("featured")
    const isNew = searchParams.get("new")
    const offers = searchParams.get("offers") || searchParams.get("onSale")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")
    const search = searchParams.get("search")
    const includeAll = searchParams.get("includeAll") === "true"

    // Build where clause
    // includeAll se usa desde el panel admin para ver también productos
    // inactivos o sin stock, que la tienda pública no debe mostrar.
    const where: Record<string, unknown> = includeAll
      ? {}
      : {
          isActive: true,
          stock: { gt: 0 },
        }

    if (category) {
      where.category = {
        OR: [
          { slug: { equals: category, mode: "insensitive" } },
          { name: { equals: category, mode: "insensitive" } },
        ],
      }
    }

    if (brand) {
      where.brand = { slug: brand }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) (where.price as Record<string, number>).gte = Number(minPrice)
      if (maxPrice) (where.price as Record<string, number>).lte = Number(maxPrice)
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (isNew === "true") {
      where.isNew = true
    }

    if (offers === "true") {
      where.comparePrice = { not: null, gt: 0 }
    }

    // Búsqueda (ver src/lib/search.ts): IDs ordenados por relevancia.
    let searchIds: string[] | null = null
    if (search && search.trim()) {
      searchIds = await searchProductIds(search, { inStockOnly: !includeAll, limit: 500 })
      where.id = { in: searchIds }
    }



    const takeNum = limit ? Number(limit) : undefined
    const skipNum = offset ? Number(offset) : 0

    let products
    let total

    if (searchIds && (sortBy === "newest" || sortBy === "relevance")) {
      // Con búsqueda, el orden por defecto es por relevancia (el de searchIds).
      const matching = await prisma.product.findMany({
        where,
        include: { category: true, brand: true },
      })
      const rank = new Map(searchIds.map((id, i) => [id, i]))
      const sorted = matching.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
      total = sorted.length
      products = takeNum ? sorted.slice(skipNum, skipNum + takeNum) : sorted.slice(skipNum)
    } else if (sortBy === "popular" || sortBy === "best-selling") {
      // Ordenar por ventas reales no es un simple orderBy de columna: hay
      // que traer los productos que cumplen los filtros, sumar sus unidades
      // vendidas (OrderItem de pedidos confirmados) y recién ahí ordenar y
      // paginar en memoria. Para un catálogo de miles de productos sin
      // filtrar esto puede pesar; si el catálogo crece mucho conviene pasar
      // a un contador de ventas denormalizado en Product.
      const matching = await prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { category: true, brand: true },
      })

      const soldByProduct = await getSoldQuantityByProduct(matching.map((p) => p.id))

      const sorted = [...matching].sort(
        (a, b) => (soldByProduct.get(b.id) ?? 0) - (soldByProduct.get(a.id) ?? 0)
      )

      total = sorted.length
      products = takeNum ? sorted.slice(skipNum, skipNum + takeNum) : sorted.slice(skipNum)
    } else {
      let orderBy: Record<string, string> = { createdAt: "desc" }
      switch (sortBy) {
        case "price-asc":
          orderBy = { price: "asc" }
          break
        case "price-desc":
          orderBy = { price: "desc" }
          break
        case "newest":
          orderBy = { createdAt: "desc" }
          break
      }

      // findMany y count salen a la vez en vez de uno detrás del otro
      ;[products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          include: {
            category: true,
            brand: true,
          },
          take: takeNum,
          skip: skipNum,
        }),
        prisma.product.count({ where }),
      ])
    }

    return NextResponse.json({
      products: products.map(transformProduct),
      total,
      limit: takeNum ?? null,
      offset: skipNum,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: body.price,
        comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
        stock: body.stock || 0,
        images: body.images || [],
        specs: body.specs || {},
        isNew: body.isNew || false,
        isFeatured: body.isFeatured || false,
        showPrice: body.showPrice ?? true,
        freeShipping: body.freeShipping ?? false,
        returnPolicy: body.returnPolicy ?? false,
        returnDays: body.returnPolicy && body.returnDays ? Number(body.returnDays) : null,
        warranty: body.warranty ?? false,
        warrantyPeriod: body.warranty && body.warrantyPeriod ? String(body.warrantyPeriod) : null,
        categoryId: body.categoryId,
        brandId: body.brandId || null,
      },
      include: {
        category: true,
        brand: true,
      },
    })

    invalidateProducts()

    return NextResponse.json(transformProduct(product), { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    )
  }
}
