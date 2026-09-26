import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = Promise<{ id: string }>

const PAGE_WIDTH = 595.28 // A4 portrait, points
const PAGE_HEIGHT = 841.89
const MARGIN = 50

function fmtMoney(n: number) {
  return `$ ${n.toFixed(2)}`
}

// Igual que fmtMoney pero conserva hasta 4 decimales para materiales de
// centavos (ej. clavos a $0.017) en vez de redondearlos a 2 decimales.
function fmtPrice(n: number) {
  const trimmed = n.toFixed(4).replace(/(\.\d{2}\d*?)0+$/, "$1").replace(/\.$/, "")
  return `$ ${trimmed}`
}

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
      calculator: { select: { name: true } },
      items: true,
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
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const brandBlue = rgb(0.08, 0.16, 0.45)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.92, 0.92, 0.92)
  const black = rgb(0.1, 0.1, 0.1)

  let y = PAGE_HEIGHT - MARGIN

  // Header
  page.drawRectangle({ x: 0, y: y - 10, width: PAGE_WIDTH, height: 70, color: brandBlue })
  page.drawText("TumbadosZumba", {
    x: MARGIN,
    y: y + 20,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  page.drawText("Acabados en interiores · Gypsum, PVC y construcción en seco", {
    x: MARGIN,
    y: y + 2,
    size: 9,
    font,
    color: rgb(0.85, 0.88, 1),
  })
  page.drawText("PROFORMA", {
    x: PAGE_WIDTH - MARGIN - 90,
    y: y + 20,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  page.drawText(`N°: ${proforma.id.slice(-8).toUpperCase()}`, {
    x: PAGE_WIDTH - MARGIN - 90,
    y: y + 2,
    size: 9,
    font,
    color: rgb(0.85, 0.88, 1),
  })

  y -= 100

  // Client + meta info block
  const infoLines = [
    [`Cliente:`, proforma.user?.name || "—"],
    [`Email:`, proforma.user?.email || "—"],
    [`Teléfono:`, proforma.contactPhone || proforma.user?.phone || "No ingresado"],
    [`Sistema:`, proforma.calculator.name],
    [`Área:`, `${Number(proforma.area)} m²`],
    [`Fecha:`, proforma.createdAt.toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })],
  ]

  for (const [label, value] of infoLines) {
    page.drawText(label, { x: MARGIN, y, size: 10, font: fontBold, color: gray })
    page.drawText(String(value), { x: MARGIN + 70, y, size: 10, font, color: black })
    y -= 16
  }

  y -= 14

  // Table header
  const col = {
    name: MARGIN,
    qty: MARGIN + 240,
    unit: MARGIN + 300,
    price: MARGIN + 370,
    total: MARGIN + 450,
  }

  page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_WIDTH - MARGIN * 2, height: 22, color: lightGray })
  page.drawText("Material", { x: col.name + 4, y, size: 9, font: fontBold, color: black })
  page.drawText("Cant.", { x: col.qty, y, size: 9, font: fontBold, color: black })
  page.drawText("Unidad", { x: col.unit, y, size: 9, font: fontBold, color: black })
  page.drawText("P. Unit.", { x: col.price, y, size: 9, font: fontBold, color: black })
  page.drawText("Total", { x: col.total, y, size: 9, font: fontBold, color: black })
  y -= 26

  for (const item of items) {
    page.drawText(item.name, { x: col.name + 4, y, size: 9, font, color: black })
    page.drawText(String(item.quantity), { x: col.qty, y, size: 9, font, color: black })
    page.drawText(item.unit, { x: col.unit, y, size: 9, font, color: black })
    page.drawText(item.unitPrice != null ? fmtPrice(item.unitPrice) : "—", { x: col.price, y, size: 9, font, color: black })
    page.drawText(fmtPrice(item.total), { x: col.total, y, size: 9, font, color: black })
    y -= 20
    page.drawLine({
      start: { x: MARGIN, y: y + 8 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 8 },
      thickness: 0.5,
      color: lightGray,
    })
  }

  y -= 10
  page.drawRectangle({ x: col.price - 10, y: y - 6, width: PAGE_WIDTH - MARGIN - (col.price - 10), height: 24, color: brandBlue })
  page.drawText("TOTAL", { x: col.price, y: y + 1, size: 10, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText(fmtMoney(grandTotal), { x: col.total, y: y + 1, size: 10, font: fontBold, color: rgb(1, 1, 1) })

  y -= 60
  page.drawText(
    "Proforma generada automáticamente. Precios sujetos a confirmación y disponibilidad de stock.",
    { x: MARGIN, y, size: 8, font, color: gray }
  )

  const pdfBytes = await pdfDoc.save()

  const download = request.nextUrl.searchParams.get("download") === "1"

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="proforma-${proforma.id.slice(-8)}.pdf"`,
    },
  })
}
