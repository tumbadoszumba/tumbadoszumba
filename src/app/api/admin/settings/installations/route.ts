import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { invalidateInstallationsImages } from "@/lib/cache-tags"
import {
  getInstallationsImages,
  INSTALLATIONS_IMAGES_SETTING_KEY,
} from "@/lib/installations-images.server"

async function requireAdmin() {
  const session = await auth()
  return !!session?.user?.id && session.user.role === "ADMIN"
}

// Cadena vacía = volver a la foto original.
const imageUrl = z.string().trim().refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Enlace de imagen no válido")
const schema = z.object({ storeImage: imageUrl, workImage: imageUrl })

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  return NextResponse.json(await getInstallationsImages())
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
    where: { key: INSTALLATIONS_IMAGES_SETTING_KEY },
    create: { key: INSTALLATIONS_IMAGES_SETTING_KEY, value },
    update: { value },
  })
  invalidateInstallationsImages()

  return NextResponse.json(await getInstallationsImages())
}
