import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = Promise<{ id: string }>

// Sin reglas (null, vacío o sin ninguna regla activa) se guarda como null.
function parseRules(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return Prisma.JsonNull
  return value as Prisma.InputJsonValue
}

function parseUnitPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = parseFloat(value as string)
  return Number.isFinite(parsed) ? parsed : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { name, unit, yield: yieldValue, unitPrice, rules } = body

    const maxPosition = await prisma.calculatorMaterial.findFirst({
      where: { calculatorId: id },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const newPosition = (maxPosition?.position ?? -1) + 1

    const material = await prisma.calculatorMaterial.create({
      data: {
        name,
        unit,
        yield: parseFloat(yieldValue),
        unitPrice: parseUnitPrice(unitPrice),
        rules: parseRules(rules),
        position: newPosition,
        calculatorId: id
      }
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    await params
    const body = await req.json()
    const { materialId, name, unit, yield: yieldValue, position, unitPrice, rules } = body

    const material = await prisma.calculatorMaterial.update({
      where: { id: materialId },
      data: {
        name,
        unit,
        yield: parseFloat(yieldValue),
        unitPrice: parseUnitPrice(unitPrice),
        rules: parseRules(rules),
        position: parseInt(position)
      }
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    await params
    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      )
    }

    await prisma.calculatorMaterial.delete({
      where: { id: materialId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
