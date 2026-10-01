import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { changeVendedoresAccessPin } from "@/lib/vendedores-access"
import { isValidPin } from "@/lib/seller-pin"

const schema = z.object({
  currentPin: z.string().trim().min(1),
  newPin: z.string().refine(isValidPin, "La clave nueva debe tener 6 dígitos"),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const ok = await changeVendedoresAccessPin(parsed.data.currentPin, parsed.data.newPin)
    if (!ok) {
      return NextResponse.json({ error: "La clave actual es incorrecta" }, { status: 401 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error changing vendedores access pin:", error)
    return NextResponse.json({ error: "Error al cambiar la clave" }, { status: 500 })
  }
}
