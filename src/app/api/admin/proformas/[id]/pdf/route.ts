import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { computeTotals } from "@/lib/proforma-totals"
import { renderProformaPdf } from "@/lib/pdf/ProformaPdf"

type Params = Promise<{ id: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  const proforma = await prisma.proforma.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { orderBy: { position: "asc" } },
    },
  })

  if (!proforma) {
    return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 })
  }

  const items = proforma.items.map((item) => ({
    name: item.name,
    unit: item.unit,
    quantity: Number(item.quantity),
    unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
    total: Number(item.quantity) * Number(item.unitPrice ?? 0),
  }))
  const itemsTotal = items.reduce((sum, item) => sum + item.total, 0)
  const adjustmentValue = proforma.adjustmentValue != null ? Number(proforma.adjustmentValue) : null
  const totals = computeTotals(
    itemsTotal,
    proforma.adjustmentType,
    proforma.adjustmentDirection,
    adjustmentValue
  )

  const adjustmentLabel =
    proforma.adjustmentType && adjustmentValue != null
      ? `${proforma.adjustmentDirection === "decrease" ? "Descuento" : "Recargo"} ${
          proforma.adjustmentType === "percentage" ? `${adjustmentValue}%` : "fijo"
        }`
      : null

  const pdf = await renderProformaPdf({
    number: proforma.id.slice(-8).toUpperCase(),
    createdAt: proforma.createdAt,
    client: {
      name: proforma.contactName || proforma.user?.name || "",
      document: proforma.contactDocument || "",
      phone: proforma.contactPhone || proforma.user?.phone || "",
    },
    blankClient: request.nextUrl.searchParams.get("blank") === "1",
    items,
    adjustment:
      adjustmentLabel && totals.adjustmentAmount !== 0
        ? { label: adjustmentLabel, amount: totals.adjustmentAmount }
        : null,
    subtotal: totals.subtotal,
    iva: totals.iva,
    total: totals.total,
  })

  const download = request.nextUrl.searchParams.get("download") === "1"

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="proforma-${proforma.id.slice(-8)}.pdf"`,
    },
  })
}
