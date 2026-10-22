import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cloudinary } from "@/lib/cloudinary"

export async function GET() {
  try {
    const items = await prisma.mediaItem.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error listing media:", error)
    return NextResponse.json(
      { error: "Error al cargar la biblioteca de medios" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "general"

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WebP, GIF)" },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 5MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<{
      secure_url: string
      public_id: string
      width: number
      height: number
      bytes: number
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `basictech/media/${folder}`,
            resource_type: "image",
            transformation: [
              { width: 1920, height: 1920, crop: "limit" },
              // auto:best guarda la foto casi sin pérdida; la compresión la hace la entrega
              { quality: "auto:best" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error)
            else
              resolve(
                result as {
                  secure_url: string
                  public_id: string
                  width: number
                  height: number
                  bytes: number
                }
              )
          }
        )
        .end(buffer)
    })

    const item = await prisma.mediaItem.create({
      data: {
        name: file.name,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        size: result.bytes,
        folder,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error uploading media:", error)
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Se requiere el id" }, { status: 400 })
    }

    const item = await prisma.mediaItem.findUnique({ where: { id } })
    if (!item) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await cloudinary.uploader.destroy(item.publicId)
    await prisma.mediaItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json(
      { error: "Error al eliminar la imagen" },
      { status: 500 }
    )
  }
}
