import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null
  }
  return session
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
    include: { sellers: { orderBy: { createdAt: "asc" } } },
  })

  return NextResponse.json(
    branches.map((b) => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      address: b.address,
      active: b.active,
      sellers: b.sellers.map((s) => ({ id: s.id, name: s.name, active: s.active, branchId: s.branchId })),
    }))
  )
}

const createBranchSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
})

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createBranchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  const branch = await prisma.branch.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  })

  return NextResponse.json({ id: branch.id, name: branch.name, phone: branch.phone, address: branch.address, active: branch.active, sellers: [] }, { status: 201 })
}
