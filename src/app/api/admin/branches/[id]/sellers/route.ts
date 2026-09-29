import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { hashPin, isValidPin } from "@/lib/seller-pin"

type Params = Promise<{ id: string }>

const createSellerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  pin: z.string().refine(isValidPin, "La clave debe tener 6 dígitos"),
})

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id: branchId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 })
  }
  const parsed = createSellerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ error: "Local no encontrado" }, { status: 404 })
    }

    const pinHash = await hashPin(parsed.data.pin)
    const seller = await prisma.seller.create({
      data: { name: parsed.data.name, pinHash, branchId },
    })

    return NextResponse.json(
      { id: seller.id, name: seller.name, active: seller.active, branchId: seller.branchId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating seller:", error)
    return NextResponse.json({ error: "Error al crear el vendedor" }, { status: 500 })
  }
}
