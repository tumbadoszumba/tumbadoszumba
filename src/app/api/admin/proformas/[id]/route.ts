import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
        items: true,
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
      unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
      total: Number(item.quantity) * Number(item.unitPrice ?? 0),
    }))

    return NextResponse.json({
      id: proforma.id,
      status: proforma.status,
      area: Number(proforma.area),
      contactName: proforma.contactName,
      contactPhone: proforma.contactPhone,
      contactEmail: proforma.contactEmail,
      createdAt: proforma.createdAt.toISOString(),
      user: proforma.user,
      calculator: proforma.calculator,
      items,
      total: items.reduce((sum, item) => sum + item.total, 0),
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
