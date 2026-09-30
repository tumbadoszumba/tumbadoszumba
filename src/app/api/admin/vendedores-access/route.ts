import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"

// Candado extra para entrar al modulo de Locales/Vendedores: una clave que
// solo el admin conoce, separada de la clave de cada vendedor (esa es para
// generar proformas). No crea sesion propia; se valida en cada intento.
const schema = z.object({ pin: z.string().trim().min(1) })

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Clave inválida" }, { status: 400 })
  }

  const expected = process.env.VENDEDORES_ACCESS_PIN
  if (!expected) {
    console.error("VENDEDORES_ACCESS_PIN no está configurada")
    return NextResponse.json({ error: "El acceso a Vendedores no está configurado" }, { status: 500 })
  }

  if (parsed.data.pin !== expected) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
