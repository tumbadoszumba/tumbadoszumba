import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = Promise<{ id: string }>

// Restablece TODA la proforma a sus valores originales: cada material vuelve
// a su precio real y se quita cualquier descuento/recargo aplicado al total.
export async function POST(_: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params

    const proforma = await prisma.proforma.findUnique({
      where: { id },
      select: { id: true, items: { select: { id: true, originalUnitPrice: true, originalQuantity: true } } },
    })
    if (!proforma) {
      return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 })
    }

    await prisma.$transaction([
      ...proforma.items.map((item) =>
        prisma.proformaItem.update({
          where: { id: item.id },
          data: { unitPrice: item.originalUnitPrice, quantity: item.originalQuantity },
        })
      ),
      prisma.proforma.update({
        where: { id },
        data: { adjustmentType: null, adjustmentDirection: null, adjustmentValue: null },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting proforma:", error)
    return NextResponse.json({ error: "Error al restablecer la proforma" }, { status: 500 })
  }
}
