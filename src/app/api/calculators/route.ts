import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Público: nunca incluir unitPrice aquí (lo consume la calculadora del home)
export async function GET() {
  try {
    const calculators = await prisma.calculator.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        inputs: true,
        note: true,
        position: true,
        area: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        materials: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            unit: true,
            yield: true,
            position: true,
            createdAt: true,
            updatedAt: true,
            calculatorId: true
          }
        }
      },
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(calculators)
  } catch (error) {
    console.error('Error fetching calculators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calculators' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, description, area, materials, inputs = [], note, position = 0 } = body

    const slug = name.toLowerCase().replace(/\s+/g, '-')

    const calculator = await prisma.calculator.create({
      data: {
        name,
        slug,
        description,
        inputs,
        note: note || null,
        position: Number(position) || 0,
        area: parseFloat(area),
        materials: {
          create: materials.map((material: { name: string; unit: string; yield: string | number; unitPrice?: string | number | null }, index: number) => ({
            name: material.name,
            unit: material.unit,
            yield: Number(material.yield),
            unitPrice: material.unitPrice != null && material.unitPrice !== ''
              ? Number(material.unitPrice)
              : null,
            position: index
          }))
        }
      },
      include: {
        materials: {
          orderBy: { position: 'asc' }
        }
      }
    })

    return NextResponse.json(calculator, { status: 201 })
  } catch (error) {
    console.error('Error creating calculator:', error)
    return NextResponse.json(
      { error: 'Failed to create calculator' },
      { status: 500 }
    )
  }
}
