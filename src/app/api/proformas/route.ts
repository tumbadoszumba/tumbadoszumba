import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const createProformaSchema = z.object({
  calculatorId: z.string().min(1),
  area: z.number().positive(),
  contactName: z.string().trim().optional().nullable(),
  contactPhone: z.string().trim().optional().nullable(),
  contactEmail: z.string().trim().email().optional().nullable(),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1),
        quantity: z.number().positive(),
        // El cliente puede pedir una variante del material (ej. plancha RH en vez
        // de normal) con un nombre/precio distinto al que tiene guardado el material
        // en la calculadora; si no vienen, se usa lo que ya tiene el material.
        nameOverride: z.string().trim().min(1).optional(),
        unitPriceOverride: z.number().positive().optional(),
      })
    )
    .min(1),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = createProformaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { calculatorId, area, contactName, contactPhone, contactEmail, items } = parsed.data

    const calculator = await prisma.calculator.findUnique({
      where: { id: calculatorId },
      include: { materials: true },
    })

    if (!calculator) {
      return NextResponse.json(
        { error: "Calculadora no encontrada" },
        { status: 404 }
      )
    }

    const materialsById = new Map(calculator.materials.map((m) => [m.id, m]))

    const itemsData = items
      .map((item) => {
        const material = materialsById.get(item.materialId)
        if (!material) return null
        return {
          name: item.nameOverride ?? material.name,
          unit: material.unit,
          quantity: item.quantity,
          unitPrice: item.unitPriceOverride ?? material.unitPrice,
          materialId: material.id,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    if (itemsData.length === 0) {
      return NextResponse.json(
        { error: "No hay materiales válidos para esta proforma" },
        { status: 400 }
      )
    }

    const proforma = await prisma.proforma.create({
      data: {
        userId: session.user.id,
        calculatorId,
        area,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        items: { create: itemsData },
      },
      include: { items: true },
    })

    return NextResponse.json(
      {
        id: proforma.id,
        status: proforma.status,
        createdAt: proforma.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating proforma:", error)
    return NextResponse.json(
      { error: "Error al guardar la proforma" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    const proformas = await prisma.proforma.findMany({
      where,
      select: {
        id: true,
        status: true,
        area: true,
        createdAt: true,
        calculator: { select: { id: true, name: true } },
        items: {
          select: { id: true, name: true, unit: true, quantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const transformed = proformas.map((p) => ({
      id: p.id,
      status: p.status,
      area: Number(p.area),
      createdAt: p.createdAt.toISOString(),
      calculator: p.calculator,
      items: p.items.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: Number(item.quantity),
      })),
    }))

    return NextResponse.json({ proformas: transformed })
  } catch (error) {
    console.error("Error fetching proformas:", error)
    return NextResponse.json(
      { error: "Error al obtener las proformas" },
      { status: 500 }
    )
  }
}
