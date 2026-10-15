import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export type AdminCatalogProduct = {
  id: string
  name: string
  code: string | null
  model: string | null
  isActive: boolean
  stock: number
  price: number
  cashPrice: number | null
  costPrice: number | null
}

// Catálogo con los precios internos (contado y costo), solo para el admin:
// la API pública de productos nunca los entrega. Con ?id= devuelve uno.
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get("id")
  const products = await prisma.product.findMany({
    where: id ? { id } : {},
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, code: true, model: true, isActive: true, stock: true,
      price: true, cashPrice: true, costPrice: true,
    },
  })

  const list: AdminCatalogProduct[] = products.map((p) => ({
    ...p,
    price: Number(p.price),
    cashPrice: p.cashPrice != null ? Number(p.cashPrice) : null,
    costPrice: p.costPrice != null ? Number(p.costPrice) : null,
  }))
  return NextResponse.json({ products: list })
}
