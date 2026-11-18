import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const body = await req.json()
    const { name, phone } = body
    const data: Record<string, string> = {}
    if (typeof name === "string" && name.trim()) data.name = name.trim()
    if (typeof phone === "string") data.phone = phone.trim() || undefined as unknown as string
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
    }
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const userId = session.user.id

    await prisma.$transaction([
      // Se conservan las direcciones ligadas a pedidos existentes (historial contable);
      // el resto de direcciones del usuario sí se eliminan.
      prisma.address.deleteMany({
        where: { userId, orders: { none: {} } },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          status: "INACTIVE",
          deletedAt: new Date(),
          name: "Usuario eliminado",
          email: `deleted-${userId}@tumbadoszumba.local`,
          phone: null,
          avatar: null,
          password: null,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Error al eliminar la cuenta" },
      { status: 500 }
    )
  }
}
