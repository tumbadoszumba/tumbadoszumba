import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export type ProformaClient = {
  key: string
  kind: "account" | "guest"
  userId: string | null
  name: string
  phone: string | null
  email: string | null
  document: string | null
  proformaCount: number
}

// Buscador de clientes para «Generar proforma»: los que tienen cuenta y los
// que pidieron proformas sin cuenta (se agrupan por teléfono). Busca por
// nombre, teléfono, correo, cédula/RUC o código TZ-… de una proforma.
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) return NextResponse.json({ clients: [] })

  try {
    const contains = { contains: q, mode: "insensitive" as const }

    const [users, codeUsers, guestProformas] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null, OR: [{ name: contains }, { email: contains }, { phone: { contains: q } }] },
        select: { id: true, name: true, email: true, phone: true, _count: { select: { proformas: true } } },
        take: 8,
      }),
      // Clientes con cuenta encontrados por el código de una de sus proformas.
      prisma.proforma.findMany({
        where: { requestCode: contains, userId: { not: null } },
        select: { user: { select: { id: true, name: true, email: true, phone: true, _count: { select: { proformas: true } } } } },
        take: 5,
      }),
      prisma.proforma.findMany({
        where: {
          deletedAt: null,
          userId: null,
          OR: [
            { contactName: contains },
            { contactPhone: { contains: q } },
            { contactDocument: { contains: q } },
            { requestCode: contains },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: { contactName: true, contactPhone: true, contactEmail: true, contactDocument: true },
        take: 50,
      }),
    ])

    const clients = new Map<string, ProformaClient>()
    for (const u of [...users, ...codeUsers.flatMap((p) => (p.user ? [p.user] : []))]) {
      clients.set(`u:${u.id}`, {
        key: `u:${u.id}`,
        kind: "account",
        userId: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        document: null,
        proformaCount: u._count.proformas,
      })
    }
    // Los datos más recientes de cada cliente sin cuenta quedan primero.
    for (const p of guestProformas) {
      const digits = p.contactPhone?.replace(/\D/g, "")
      const key = digits ? `p:${digits}` : `n:${(p.contactName ?? "").toLowerCase()}`
      const existing = clients.get(key)
      if (existing) {
        existing.proformaCount += 1
        existing.document ??= p.contactDocument
        existing.email ??= p.contactEmail
        continue
      }
      clients.set(key, {
        key,
        kind: "guest",
        userId: null,
        name: p.contactName || "Sin nombre",
        phone: p.contactPhone,
        email: p.contactEmail,
        document: p.contactDocument,
        proformaCount: 1,
      })
    }

    return NextResponse.json({ clients: [...clients.values()].slice(0, 12) })
  } catch (error) {
    console.error("Error searching proforma clients:", error)
    return NextResponse.json({ error: "Error al buscar clientes" }, { status: 500 })
  }
}
