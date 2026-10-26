import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}

    if (role) {
      where.role = role.toUpperCase()
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          select: {
            total: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role.toLowerCase(),
      status: user.status.toLowerCase(),
      createdAt: user.createdAt.toISOString(),
      orders: user._count.orders,
      totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0),
    }))

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()

    if (!body.email || !body.name || typeof body.password !== "string" || body.password.length < 6) {
      return NextResponse.json({ error: "Datos de usuario inválidos" }, { status: 400 })
    }
    const password = await bcrypt.hash(body.password, 12)

    // In a real app, you'd hash the password here
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password,
        name: body.name,
        phone: body.phone,
        role: body.role?.toUpperCase() || "CUSTOMER",
        status: "ACTIVE",
      },
    })

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        status: user.status.toLowerCase(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Error creating user" },
      { status: 500 }
    )
  }
}
