import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()

    const updated = await prisma.message.update({
      where: { id },
      data: {
        isRead: body.isRead !== undefined ? body.isRead : true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error al actualizar estado del mensaje:", error)
    return NextResponse.json(
      { error: "Error al actualizar mensaje" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await context.params
    await prisma.message.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar mensaje:", error)
    return NextResponse.json(
      { error: "Error al eliminar mensaje" },
      { status: 500 }
    )
  }
}
