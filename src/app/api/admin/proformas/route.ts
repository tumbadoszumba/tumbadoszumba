import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
    if (userId) {
      where.userId = userId
    }
    if (q) {
      where.OR = [
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
        status: p.status,
        area: Number(p.area),
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
