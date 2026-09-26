import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = Promise<{ id: string; itemId: string }>

const updateItemSchema = z.object({
  unitPrice: z.number().nonnegative().nullable(),
})

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id, itemId } = await params
    const body = await request.json()
    const parsed = updateItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await prisma.proformaItem.findFirst({
      where: { id: itemId, proformaId: id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 })
    }

    const item = await prisma.proformaItem.update({
      where: { id: itemId },
      data: { unitPrice: parsed.data.unitPrice },
    })

    return NextResponse.json({
      id: item.id,
      unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
    })
  } catch (error) {
    console.error("Error updating proforma item:", error)
    return NextResponse.json(
      { error: "Error al actualizar el material" },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id, itemId } = await params

    const existing = await prisma.proformaItem.findFirst({
      where: { id: itemId, proformaId: id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 })
    }

    await prisma.proformaItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting proforma item:", error)
    return NextResponse.json(
      { error: "Error al eliminar el material" },
      { status: 500 }
    )
  }
}
