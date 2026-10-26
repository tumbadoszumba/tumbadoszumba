import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getClientIp, isRateLimited } from "@/lib/rate-limit"

const CONTACT_LIMIT = 5
const CONTACT_WINDOW_MS = 10 * 60 * 1000

// POST: Enviar un nuevo mensaje desde el formulario de contacto (público)
export async function POST(request: NextRequest) {
  if (isRateLimited(`messages:${getClientIp(request.headers)}`, CONTACT_LIMIT, CONTACT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Enviaste varios mensajes seguidos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const message = typeof body.message === "string" ? body.message.trim() : ""

    if (!name || !email || !subject || !message || name.length > 120 || email.length > 254 || phone.length > 40 || subject.length > 180 || message.length > 5000) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados" },
        { status: 400 }
      )
    }

    const newMessage = await prisma.message.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
      },
    })

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("Error al guardar mensaje:", error)
    return NextResponse.json(
      { error: "Error al enviar el mensaje" },
      { status: 500 }
    )
  }
}

// GET: Listar mensajes para el panel de administración
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread") === "true"

    const where = unreadOnly ? { isRead: false } : {}

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    const unreadCount = await prisma.message.count({
      where: { isRead: false },
    })

    return NextResponse.json({
      messages,
      unreadCount,
    })
  } catch (error) {
    console.error("Error al obtener mensajes:", error)
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    )
  }
}
