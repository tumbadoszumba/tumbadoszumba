import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { computeTotals } from "@/lib/proforma-totals"
import { renderProformaPdf } from "@/lib/pdf/ProformaPdf"
import { isValidPin, verifyPin } from "@/lib/seller-pin"

type Params = Promise<{ id: string }>

const generateSchema = z.object({
  branchId: z.string().min(1),
  sellerId: z.string().min(1),
  pin: z.string().refine(isValidPin, "La clave debe tener 6 dígitos"),
  blank: z.boolean().optional(),
  download: z.boolean().optional(),
  showUnitPrice: z.boolean().optional(),
  showItemTotal: z.boolean().optional(),
})

// Generar el PDF de una proforma exige elegir Local + Vendedor y escribir la
// clave de ese vendedor (por eso es POST y no GET): así queda registrado
// quién y desde dónde se generó. El número de proforma es el correlativo del
// local y solo se asigna la primera vez; volver a generar el mismo PDF no
// crea un número nuevo.
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const parsed = generateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }
  const { branchId, sellerId, pin, blank, download, showUnitPrice, showItemTotal } = parsed.data

  const seller = await prisma.seller.findUnique({ where: { id: sellerId }, include: { branch: true } })
  if (!seller || seller.branchId !== branchId || !seller.active || !seller.branch.active) {
    return NextResponse.json({ error: "Vendedor o local no válido" }, { status: 400 })
  }
  if (!(await verifyPin(pin, seller.pinHash))) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 })
  }

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

  // Asigna el número la primera vez (correlativo del local); si ya tenía uno,
  // solo se actualiza quién/dónde la volvió a generar.
  let proformaNumber = proforma.proformaNumber
  if (proformaNumber == null) {
    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: { nextProformaNumber: { increment: 1 } },
    })
    proformaNumber = branch.nextProformaNumber - 1
  }
  await prisma.proforma.update({
    where: { id },
    data: {
      proformaNumber,
      branchId,
      branchName: seller.branch.name,
      sellerId,
      sellerName: seller.name,
    },
  })

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
    number: String(proformaNumber),
    createdAt: proforma.createdAt,
    client: {
      name: proforma.contactName || proforma.user?.name || "",
      document: proforma.contactDocument || "",
      phone: proforma.contactPhone || proforma.user?.phone || "",
    },
    blankClient: blank === true,
    sellerName: seller.name,
    branchName: seller.branch.name,
    showUnitPrice: showUnitPrice === true,
    showItemTotal: showItemTotal === true,
    items,
    adjustment:
      adjustmentLabel && totals.adjustmentAmount !== 0
        ? { label: adjustmentLabel, amount: totals.adjustmentAmount }
        : null,
    subtotal: totals.subtotal,
    iva: totals.iva,
    total: totals.total,
  })

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="proforma-${proformaNumber}.pdf"`,
    },
  })
}
