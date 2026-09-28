import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = Promise<{ id: string }>

const createItemSchema = z.object({
  name: z.string().trim().min(1),
  unit: z.string().trim().min(1).default("und"),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative().nullable().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = createItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const proforma = await prisma.proforma.findUnique({
      where: { id },
      select: { id: true, items: { select: { position: true }, orderBy: { position: "desc" }, take: 1 } },
    })
    if (!proforma) {
      return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 })
    }

    const nextPosition = (proforma.items[0]?.position ?? -1) + 1
    const unitPrice = parsed.data.unitPrice ?? null

    const item = await prisma.proformaItem.create({
      data: {
        proformaId: id,
        name: parsed.data.name,
        unit: parsed.data.unit,
        quantity: parsed.data.quantity,
        originalQuantity: parsed.data.quantity,
        unitPrice,
        originalUnitPrice: unitPrice,
        position: nextPosition,
      },
    })

    return NextResponse.json({ id: item.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating proforma item:", error)
    return NextResponse.json(
      { error: "Error al agregar el material" },
      { status: 500 }
    )
  }
}
