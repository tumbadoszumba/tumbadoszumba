import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createProformaWithCode } from "@/lib/proforma-request-code"
import { getClientIp, isRateLimited } from "@/lib/rate-limit"

// Sin sesión se limita cuántas proformas puede enviar una misma IP.
const GUEST_LIMIT = 5
const GUEST_WINDOW_MS = 10 * 60 * 1000

// Número de WhatsApp: dígitos con espacios, guiones o + opcionales.
const PHONE_RE = /^\+?[\d\s-]{7,20}$/

const contactSchema = {
  contactName: z.string().trim().optional().nullable(),
  contactPhone: z.string().trim().optional().nullable(),
  contactEmail: z.string().trim().email().optional().nullable(),
}

// Proforma desde la calculadora de materiales.
const calculatorProformaSchema = z.object({
  source: z.literal("calculator").optional(),
  calculatorId: z.string().min(1),
  area: z.number().positive(),
  ...contactSchema,
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

// Proforma desde el carrito (pedido por WhatsApp). Los nombres y precios se
// toman de la BD, no de lo que mande el navegador.
const cartProformaSchema = z.object({
  source: z.literal("cart"),
  ...contactSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1)
    .max(200),
})

type ProformaItemData = {
  name: string
  unit: string
  quantity: number
  originalQuantity: number
  unitPrice: number | Prisma.Decimal | null
  originalUnitPrice: number | Prisma.Decimal | null
  materialId?: string
  productId?: string
  position: number
}

// La calculadora y el carrito se pueden usar sin iniciar sesión: en ese caso
// la proforma se guarda sin usuario y el nombre y el WhatsApp del cliente son
// obligatorios.
export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id ?? null

  if (!userId && isRateLimited(`proformas:${getClientIp(request.headers)}`, GUEST_LIMIT, GUEST_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Enviaste varias solicitudes seguidas. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const parsed =
      body?.source === "cart"
        ? cartProformaSchema.safeParse(body)
        : calculatorProformaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { contactName, contactPhone, contactEmail } = parsed.data

    if (!userId && (!contactName || contactName.length < 2 || !contactPhone || !PHONE_RE.test(contactPhone))) {
      return NextResponse.json(
        { error: "Ingresa tu nombre y tu número de WhatsApp" },
        { status: 400 }
      )
    }

    let itemsData: ProformaItemData[]
    let origin: { source: "CALCULADORA"; calculatorId: string; area: number } | { source: "CARRITO" }

    if (parsed.data.source === "cart") {
      const { items } = parsed.data
      const products = await prisma.product.findMany({
        where: { id: { in: items.map((item) => item.productId) } },
        select: { id: true, name: true, price: true },
      })
      const productsById = new Map(products.map((p) => [p.id, p]))

      itemsData = items
        .map((item, index) => {
          const product = productsById.get(item.productId)
          if (!product) return null
          const unitPrice = Number(product.price)
          return {
            name: product.name,
            unit: "und",
            quantity: item.quantity,
            originalQuantity: item.quantity,
            unitPrice,
            originalUnitPrice: unitPrice,
            productId: product.id,
            position: index,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
      origin = { source: "CARRITO" }
    } else {
      const { calculatorId, area, items } = parsed.data
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

      itemsData = items
        .map((item, index) => {
          const material = materialsById.get(item.materialId)
          if (!material) return null
          const unitPrice = item.unitPriceOverride ?? material.unitPrice
          return {
            name: item.nameOverride ?? material.name,
            unit: material.unit,
            quantity: item.quantity,
            originalQuantity: item.quantity,
            unitPrice,
            originalUnitPrice: unitPrice,
            materialId: material.id,
            position: index,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
      origin = { source: "CALCULADORA", calculatorId, area }
    }

    if (itemsData.length === 0) {
      return NextResponse.json(
        { error: "No hay productos válidos para esta proforma" },
        { status: 400 }
      )
    }

    const proforma = await createProformaWithCode({
      ...origin,
      userId,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      items: { create: itemsData },
    })

    return NextResponse.json(
      {
        id: proforma.id,
        requestCode: proforma.requestCode,
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
        requestCode: true,
        status: true,
        source: true,
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
      requestCode: p.requestCode,
      status: p.status,
      source: p.source,
      area: p.area != null ? Number(p.area) : null,
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
