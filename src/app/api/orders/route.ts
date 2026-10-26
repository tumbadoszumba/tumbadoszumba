import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    // Get authenticated user
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status.toLowerCase(),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingAddress: `${order.address.address}, ${order.address.city}`,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        brand: item.product.id, // Would need to join with brand
        price: Number(item.price),
        quantity: item.quantity,
        image: item.product.images[0] || "",
      })),
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    if (!Array.isArray(body.items) || body.items.length === 0 || !body.addressId) {
      return NextResponse.json({ error: "Datos del pedido inválidos" }, { status: 400 })
    }

    const address = await prisma.address.findFirst({
      where: { id: String(body.addressId), userId: session.user.id },
      select: { id: true },
    })
    if (!address) {
      return NextResponse.json({ error: "Dirección no válida" }, { status: 400 })
    }

    const requestedItems = body.items as Array<{ productId?: string; quantity?: number }>
    const products = await prisma.product.findMany({
      where: {
        id: { in: requestedItems.map((item) => String(item.productId || "")) },
        isActive: true,
        stock: { gt: 0 },
      },
      select: { id: true, name: true, price: true, stock: true },
    })
    const productsById = new Map(products.map((product) => [product.id, product]))
    const items = requestedItems.map((item) => {
      const product = productsById.get(String(item.productId || ""))
      const quantity = Number(item.quantity)
      if (!product || !Number.isInteger(quantity) || quantity <= 0 || quantity > product.stock) return null
      const price = Number(product.price)
      return { productId: product.id, name: product.name, price, quantity, total: price * quantity }
    })

    if (items.some((item) => item === null)) {
      return NextResponse.json({ error: "Uno o más productos no están disponibles" }, { status: 400 })
    }

    const validItems = items as Array<{ productId: string; name: string; price: number; quantity: number; total: number }>
    const subtotal = validItems.reduce((sum, item) => sum + item.total, 0)
    const shipping = Math.max(0, Number(body.shipping) || 0)

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        subtotal,
        shipping,
        total: subtotal + shipping,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        userId: session.user.id,
        addressId: address.id,
        items: {
          create: validItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            productId: item.productId,
          })),
        },
      },
      include: {
        items: true,
        address: true,
      },
    })

    return NextResponse.json(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 }
    )
  }
}
