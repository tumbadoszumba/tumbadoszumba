import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const status = String(body.status || "").toUpperCase()

    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      id: user.id,
      status: user.status.toLowerCase(),
    })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    )
  }
}
