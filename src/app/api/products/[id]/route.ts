import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformProduct } from "@/lib/transformers"
import { cloudinary } from "@/lib/cloudinary"
import { invalidateProducts } from "@/lib/cache-tags"

type Params = Promise<{ id: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    // Try to find by slug first, then by id
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: id }, { id: id }],
      },
      include: {
        category: true,
        brand: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(transformProduct(product))
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Error fetching product" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const body = await request.json()


    // Build the data object with explicit type coercion
    const updateData: Record<string, unknown> = {
      name: String(body.name),
      slug: String(body.slug),
      description: body.description ? String(body.description) : null,
      price: Number(body.price),
      comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
      stock: Number(body.stock) || 0,
      images: Array.isArray(body.images) ? body.images : [],
      specs: body.specs || {},
      isNew: Boolean(body.isNew),
      isFeatured: Boolean(body.isFeatured),
      showPrice: body.showPrice !== undefined ? Boolean(body.showPrice) : true,
      freeShipping: Boolean(body.freeShipping),
      returnPolicy: Boolean(body.returnPolicy),
      returnDays: body.returnPolicy && body.returnDays ? Number(body.returnDays) : null,
      warranty: Boolean(body.warranty),
      warrantyPeriod: body.warranty && body.warrantyPeriod ? String(body.warrantyPeriod) : null,
      categoryId: String(body.categoryId),
      brandId: body.brandId ? String(body.brandId) : null,
    }
    // Solo se cambia si viene: antes se reactivaba el producto en cada edición
    // porque el formulario no manda este campo («Mostrar» en la lista).
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)
    // Datos del sistema de facturación: solo si vienen (formulario nuevo).
    if (body.code !== undefined) updateData.code = body.code ? String(body.code).trim() : null
    if (body.model !== undefined) updateData.model = body.model ? String(body.model).trim() : null
    if (body.cashPrice !== undefined) updateData.cashPrice = body.cashPrice != null && body.cashPrice !== "" ? Number(body.cashPrice) : null
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice != null && body.costPrice !== "" ? Number(body.costPrice) : null

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        brand: true,
      },
    })

    invalidateProducts()

    return NextResponse.json(transformProduct(product))
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Ese código ya lo usa otro producto" }, { status: 409 })
    }
    console.error("Error updating product:", error)
    const message = error instanceof Error ? error.message : "Error updating product"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    // 1. Obtener el producto con sus imágenes antes de eliminarlo
    const product = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // 2. Eliminar imágenes de Cloudinary si existen
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(async (imageUrl) => {
        try {
          // Extraer el public_id de la URL de Cloudinary
          // Formato: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public_id>.<ext>
          const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/)
          if (match && match[1]) {
            const publicId = match[1]
            await cloudinary.uploader.destroy(publicId)
          }
        } catch (cloudinaryError) {
          // Loggear error pero no interrumpir la eliminación del producto
          console.error(`Error eliminando imagen de Cloudinary: ${imageUrl}`, cloudinaryError)
        }
      })

      await Promise.all(deletePromises)
    }

    // 3. Eliminar el producto de la base de datos
    await prisma.product.delete({
      where: { id },
    })

    invalidateProducts()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 }
    )
  }
}
