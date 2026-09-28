import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = Promise<{ id: string }>

export async function POST(_: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params
    const proforma = await prisma.proforma.update({
      where: { id },
      data: { deletedAt: null },
    })
    return NextResponse.json({ id: proforma.id })
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Proforma no encontrada" }, { status: 404 })
    }
    console.error("Error restoring proforma:", error)
    return NextResponse.json({ error: "Error al restaurar la proforma" }, { status: 500 })
  }
}
