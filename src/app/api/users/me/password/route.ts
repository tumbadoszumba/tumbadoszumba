import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (user?.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Debes ingresar tu contraseña actual" },
          { status: 400 }
        )
      }
      const match = await bcrypt.compare(currentPassword, user.password)
      if (!match) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        )
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 })
  }
}
