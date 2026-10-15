import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { renderProformaPdf } from "@/lib/pdf/ProformaPdf"
import { fromStored } from "@/lib/proforma-versions"

type Params = Promise<{ id: string; versionId: string }>

// Vuelve a armar el PDF de una versión anterior con los datos guardados (el
// archivo no se guarda). No pide la clave del vendedor: no asigna número ni
// cambia nada, solo muestra lo que ya se generó.
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id, versionId } = await params
  const version = await prisma.proformaVersion.findUnique({ where: { id: versionId } })
  if (!version || version.proformaId !== id) {
    return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 })
  }

  const data = fromStored(version.data)
  const pdf = await renderProformaPdf(data)
  const download = request.nextUrl.searchParams.get("download") === "1"

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="proforma-${data.number}-v${version.version}.pdf"`,
    },
  })
}
