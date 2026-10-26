import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = Promise<{ id: string }>

// Solo lo usa el form de edición admin — sí puede incluir unitPrice.
export async function GET(
  _: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params

    const calculator = await prisma.calculator.findUnique({
      where: { id },
      include: {
        materials: {
          orderBy: { position: 'asc' }
        }
      }
    })

    if (!calculator) {
      return NextResponse.json(
        { error: 'Calculator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(calculator)
  } catch (error) {
    console.error('Error fetching calculator:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calculator' },
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
    const { id } = await params
    const body = await req.json()
    const { name, description, area, isActive, inputs = [], note, position = 0 } = body

    const calculator = await prisma.calculator.update({
      where: { id },
      data: {
        name,
        description,
        inputs,
        note: note || null,
        position: Number(position) || 0,
        area: parseFloat(area),
        isActive
      },
      include: {
        materials: {
          orderBy: { position: 'asc' }
        }
      }
    })

    return NextResponse.json(calculator)
  } catch (error) {
    console.error('Error updating calculator:', error)
    return NextResponse.json(
      { error: 'Failed to update calculator' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params

    await prisma.calculator.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calculator:', error)
    return NextResponse.json(
      { error: 'Failed to delete calculator' },
      { status: 500 }
    )
  }
}
