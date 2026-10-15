import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { invalidateProducts } from "@/lib/cache-tags"

type Params = Promise<{ id: string }>

const patchSchema = z.object({ isActive: z.boolean() })

// Interruptor «Mostrar» de la lista de productos: un producto se ve en la
// tienda solo si tiene stock y está activo.
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { id } = await params
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, isActive: true },
    })
    invalidateProducts()
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  }
}
