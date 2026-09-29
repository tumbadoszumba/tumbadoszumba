import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { computeAdjustment } from "@/lib/proforma-totals"

type Params = Promise<{ id: string }>

export async function GET(_: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params

    const proforma = await prisma.proforma.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        calculator: { select: { id: true, name: true } },
        items: { orderBy: { position: "asc" } },
      },
    })

    if (!proforma) {
      return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 })
    }

    const items = proforma.items.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: Number(item.quantity),
      originalQuantity: Number(item.originalQuantity),
      unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
      originalUnitPrice: item.originalUnitPrice != null ? Number(item.originalUnitPrice) : null,
      total: Number(item.quantity) * Number(item.unitPrice ?? 0),
      originalTotal: Number(item.originalQuantity) * Number(item.originalUnitPrice ?? 0),
    }))

    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0)
    const originalTotal = items.reduce((sum, item) => sum + item.originalTotal, 0)
    const adjustmentValue = proforma.adjustmentValue != null ? Number(proforma.adjustmentValue) : null
    const adjustmentAmount = computeAdjustment(
      itemsTotal,
      proforma.adjustmentType,
      proforma.adjustmentDirection,
      adjustmentValue
    )

    return NextResponse.json({
      id: proforma.id,
      status: proforma.status,
      area: Number(proforma.area),
      contactName: proforma.contactName,
      contactPhone: proforma.contactPhone,
      contactEmail: proforma.contactEmail,
      contactDocument: proforma.contactDocument,
      proformaNumber: proforma.proformaNumber,
      branchName: proforma.branchName,
      sellerName: proforma.sellerName,
      createdAt: proforma.createdAt.toISOString(),
      deletedAt: proforma.deletedAt ? proforma.deletedAt.toISOString() : null,
      adjustmentType: proforma.adjustmentType,
      adjustmentDirection: proforma.adjustmentDirection,
      adjustmentValue,
      user: proforma.user,
      calculator: proforma.calculator,
      items,
      itemsTotal,
      originalTotal,
      adjustmentAmount,
      total: itemsTotal + adjustmentAmount,
    })
  } catch (error) {
    console.error("Error fetching proforma:", error)
    return NextResponse.json(
      { error: "Error al obtener la proforma" },
      { status: 500 }
    )
  }
}

const updateProformaSchema = z
  .object({
    status: z.enum(["PENDIENTE", "COTIZADA", "ENVIADA"]).optional(),
    contactName: z.string().trim().optional(),
    contactPhone: z.string().trim().optional(),
    contactEmail: z.string().trim().optional(),
    contactDocument: z.string().trim().optional(),
    adjustmentType: z.enum(["percentage", "fixed"]).nullable().optional(),
    adjustmentDirection: z.enum(["increase", "decrease"]).nullable().optional(),
    adjustmentValue: z.number().nonnegative().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  })

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateProformaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const proforma = await prisma.proforma.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({
      id: proforma.id,
      status: proforma.status,
      contactName: proforma.contactName,
      contactPhone: proforma.contactPhone,
      contactEmail: proforma.contactEmail,
      contactDocument: proforma.contactDocument,
      adjustmentType: proforma.adjustmentType,
      adjustmentDirection: proforma.adjustmentDirection,
      adjustmentValue: proforma.adjustmentValue != null ? Number(proforma.adjustmentValue) : null,
    })
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 })
    }
    console.error("Error updating proforma:", error)
    return NextResponse.json(
      { error: "Error al actualizar la proforma" },
      { status: 500 }
    )
  }
}

// DELETE sin query = mover a la papelera (soft delete).
// DELETE ?permanent=1 = borrar definitivamente (solo desde la papelera).
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params
    const permanent = new URL(request.url).searchParams.get("permanent") === "1"

    if (permanent) {
      await prisma.proforma.delete({ where: { id } })
    } else {
      await prisma.proforma.update({ where: { id }, data: { deletedAt: new Date() } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 })
    }
    console.error("Error deleting proforma:", error)
    return NextResponse.json(
      { error: "Error al eliminar la proforma" },
      { status: 500 }
    )
  }
}
