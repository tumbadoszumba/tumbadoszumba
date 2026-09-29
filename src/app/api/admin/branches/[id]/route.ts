import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = Promise<{ id: string }>

const updateBranchSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    active: z.boolean().optional(),
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
  const parsed = updateBranchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const branch = await prisma.branch.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ id: branch.id, name: branch.name, phone: branch.phone, address: branch.address, active: branch.active })
  } catch (error) {
    console.error("Error updating branch:", error)
    return NextResponse.json({ error: "Local no encontrado" }, { status: 404 })
  }
}

// Borra el local y sus vendedores. Las proformas ya generadas conservan
// branchName/sellerName como historial, así que no se pierden datos.
export async function DELETE(_: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  try {
    await prisma.branch.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting branch:", error)
    return NextResponse.json({ error: "Local no encontrado" }, { status: 404 })
  }
}
