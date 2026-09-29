import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { hashPin, isValidPin } from "@/lib/seller-pin"

type Params = Promise<{ id: string }>

const updateSellerSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    active: z.boolean().optional(),
    pin: z.string().refine(isValidPin, "La clave debe tener 6 dígitos").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Debes enviar al menos un campo" })

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 })
  }
  const parsed = updateSellerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  const { pin, ...rest } = parsed.data

  try {
    const seller = await prisma.seller.update({
      where: { id },
      data: { ...rest, ...(pin ? { pinHash: await hashPin(pin) } : {}) },
    })
    return NextResponse.json({ id: seller.id, name: seller.name, active: seller.active, branchId: seller.branchId })
  } catch (error) {
    console.error("Error updating seller:", error)
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  try {
    await prisma.seller.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting seller:", error)
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
  }
}
