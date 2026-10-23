import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { invalidateStoreContact } from "@/lib/cache-tags"
import { getStoreContact, STORE_CONTACT_SETTING_KEY } from "@/lib/store-contact.server"
import { normalizePhone } from "@/lib/store-contact"

async function requireAdmin() {
  const session = await auth()
  return !!session?.user?.id && session.user.role === "ADMIN"
}

const schema = z.object({
  phone: z.string().trim().refine((v) => normalizePhone(v) !== null, "Teléfono no válido"),
  email: z.string().trim().email("Correo no válido"),
  street: z.string().trim().min(3, "Escribe la dirección").max(200),
})

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  return NextResponse.json(await getStoreContact())
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  const value = JSON.stringify(parsed.data)
  await prisma.appSetting.upsert({
    where: { key: STORE_CONTACT_SETTING_KEY },
    create: { key: STORE_CONTACT_SETTING_KEY, value },
    update: { value },
  })
  invalidateStoreContact()

  return NextResponse.json(await getStoreContact())
}
