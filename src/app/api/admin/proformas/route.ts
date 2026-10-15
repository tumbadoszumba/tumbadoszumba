import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isValidPin, verifyPin } from "@/lib/seller-pin"
import { createProformaWithCode } from "@/lib/proforma-request-code"

const TRASH_RETENTION_DAYS = 30

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const phone = searchParams.get("phone")
    const q = searchParams.get("q")
    const trash = searchParams.get("trash") === "1"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Purga perezosa: cualquier proforma que lleve más de 30 días en la
    // papelera se elimina definitivamente. No hay un cron en el proyecto, así
    // que esto corre cada vez que se abre la lista de Proformas o la Papelera.
    const purgeBefore = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    await prisma.proforma.deleteMany({ where: { deletedAt: { lt: purgeBefore } } })

    const where: Record<string, unknown> = {
      deletedAt: trash ? { not: null } : null,
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }
    // Historial de un cliente en «Generar proforma»: por su cuenta y/o por su
    // teléfono (las proformas que pidió sin iniciar sesión).
    if (userId && phone) {
      where.AND = [{ OR: [{ userId }, { contactPhone: phone }] }]
    } else if (userId) {
      where.userId = userId
    } else if (phone) {
      where.contactPhone = phone
    }
    if (q) {
      // El vendedor busca con el código que llegó en el WhatsApp (TZ-48213 o
      // solo 48213) o con los datos de contacto, porque el cliente puede no
      // tener cuenta.
      where.OR = [
        { requestCode: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
        { contactPhone: { contains: q } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { calculator: { name: { contains: q, mode: "insensitive" } } },
      ]
    }

    const [proformas, total, pendientes, cotizadas, trashCount] = await Promise.all([
      prisma.proforma.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          calculator: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: trash ? { deletedAt: "desc" } : { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.proforma.count({ where }),
      prisma.proforma.count({ where: { status: "PENDIENTE", deletedAt: null } }),
      prisma.proforma.count({ where: { status: "COTIZADA", deletedAt: null } }),
      prisma.proforma.count({ where: { deletedAt: { not: null } } }),
    ])

    const transformed = proformas.map((p) => {
      const itemsTotal = p.items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice ?? 0),
        0
      )
      const daysRemaining = p.deletedAt
        ? Math.max(
            0,
            TRASH_RETENTION_DAYS -
              Math.floor((Date.now() - p.deletedAt.getTime()) / (24 * 60 * 60 * 1000))
          )
        : null
      return {
        id: p.id,
        requestCode: p.requestCode,
        proformaNumber: p.proformaNumber,
        status: p.status,
        area: p.area != null ? Number(p.area) : null,
        source: p.source,
        createdBySellerName: p.createdBySellerName,
        contactName: p.contactName,
        contactPhone: p.contactPhone,
        createdAt: p.createdAt.toISOString(),
        deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
        daysRemaining,
        user: p.user,
        calculator: p.calculator,
        itemCount: p.items.length,
        total: itemsTotal,
      }
    })

    return NextResponse.json({
      proformas: transformed,
      total,
      pendientes,
      cotizadas,
      trashCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching admin proformas:", error)
    return NextResponse.json(
      { error: "Error al obtener las proformas" },
      { status: 500 }
    )
  }
}

const createSellerProformaSchema = z.object({
  branchId: z.string().min(1, "Elige el local"),
  sellerId: z.string().min(1, "Elige el vendedor"),
  pin: z.string().refine(isValidPin, "La clave debe tener 6 dígitos"),
  contactName: z.string().trim().min(2, "Escribe el nombre del cliente"),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  contactDocument: z.string().trim().optional(),
  // Cliente con cuenta elegido en «Cliente registrado».
  userId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        // Vacío en las líneas escritas a mano (ej. «Instalación»).
        productId: z.string().min(1).optional(),
        name: z.string().trim().min(1, "Cada línea necesita un nombre"),
        unit: z.string().trim().min(1).default("und"),
        quantity: z.number().positive("La cantidad debe ser mayor a 0"),
        unitPrice: z.number().nonnegative().nullable(),
      })
    )
    .min(1, "Agrega al menos un producto")
    .max(200),
})

// Proforma armada por un vendedor desde el admin, sin calculadora. Además de
// la sesión de admin, el vendedor se identifica con su clave de 6 dígitos (la
// misma del PDF) para que quede registrado quién la hizo.
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const parsed = createSellerProformaSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { branchId, sellerId, pin, contactName, contactPhone, contactEmail, contactDocument, userId, items } = parsed.data

    const seller = await prisma.seller.findUnique({ where: { id: sellerId }, include: { branch: true } })
    if (!seller || seller.branchId !== branchId || !seller.active || !seller.branch.active) {
      return NextResponse.json({ error: "Vendedor o local no válido" }, { status: 400 })
    }
    if (!(await verifyPin(pin, seller.pinHash))) {
      return NextResponse.json({ error: `Clave incorrecta para ${seller.name}` }, { status: 401 })
    }

    // Solo se enlazan los productos que existen; si alguno se borró mientras
    // armaba la proforma, la línea queda como escrita a mano.
    const productIds = items.flatMap((item) => (item.productId ? [item.productId] : []))
    const existing = new Set(
      (await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })).map((p) => p.id)
    )

    const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }) : null

    const proforma = await createProformaWithCode({
      source: "VENDEDOR",
      userId: user?.id ?? null,
      contactName,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      contactDocument: contactDocument || null,
      createdBySellerName: seller.name,
      // Quedan preseleccionados al generar el PDF (que los vuelve a fijar).
      branchId,
      branchName: seller.branch.name,
      sellerId,
      sellerName: seller.name,
      items: {
        create: items.map((item, index) => ({
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          originalQuantity: item.quantity,
          unitPrice: item.unitPrice,
          originalUnitPrice: item.unitPrice,
          productId: item.productId && existing.has(item.productId) ? item.productId : null,
          position: index,
        })),
      },
    })

    return NextResponse.json({ id: proforma.id, requestCode: proforma.requestCode }, { status: 201 })
  } catch (error) {
    console.error("Error creating seller proforma:", error)
    return NextResponse.json({ error: "Error al generar la proforma" }, { status: 500 })
  }
}
