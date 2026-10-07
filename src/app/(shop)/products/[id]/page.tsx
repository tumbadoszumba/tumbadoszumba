import type { Metadata } from "next"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ProductGallery } from "@/components/products/ProductGallery"
import { ProductDetail } from "@/components/products/ProductDetail"
import { ProductCard } from "@/components/products/ProductCard"
import { JsonLd } from "@/components/seo/JsonLd"
import { getProductByKey, getRelatedProducts } from "@/lib/queries-seo"
import { getCategories } from "@/lib/queries"
import type { Product } from "@/types"
import { SITE, categoryPath, productPath } from "@/lib/site"
import { breadcrumbJsonLd, pageMetadata, productJsonLd, truncate } from "@/lib/seo"

// Misma frecuencia de refresco que el resto de la tienda; el admin además
// invalida por tag al guardar un producto.
export const revalidate = 60

/** Solo se indexa lo que la tienda pública muestra: activo y con stock. */
function isIndexable(product: Product) {
  return product.isActive !== false && product.stock > 0
}

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProductByKey(id)

  if (!product) {
    return { title: "Producto no encontrado", robots: { index: false, follow: false } }
  }

  const where = `${SITE.address.city}, ${SITE.address.country}`
  const description = product.description
    ? truncate(`${product.name}. ${product.description}`, 155)
    : truncate(
        `${product.name}${product.brand && !/^sin marca$/i.test(product.brand) ? ` ${product.brand}` : ""}. Compra en ${SITE.name}, ${where}.`,
        155
      )

  return pageMetadata({
    title: truncate(product.name, 60),
    description,
    path: productPath(product.slug),
    image: product.images[0],
    // Un producto oculto en la tienda (desactivado o sin stock) se ve por enlace directo, pero no se indexa
    noindex: !isIndexable(product),
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProductByKey(id)

  if (!product) notFound()

  // Enlaces viejos con el id → una sola URL oficial con el nombre (slug)
  if (id !== product.slug) permanentRedirect(productPath(product.slug))

  const [relatedProducts, categories] = await Promise.all([
    getRelatedProducts(product.category, product.id, 4),
    getCategories(),
  ])
  const categoryName = categories.find((c) => c.slug === product.category)?.name ?? product.category
  const indexable = isIndexable(product)

  return (
    <div className="container mx-auto px-4 py-6">
      {indexable && (
        <>
          <JsonLd data={productJsonLd(product, categoryName)} />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: "Inicio", path: "/" },
              { name: "Productos", path: "/products" },
              { name: categoryName, path: categoryPath(product.category) },
              { name: product.name, path: productPath(product.slug) },
            ])}
          />
        </>
      )}

      {/* Back Button - Mobile */}
      <Button
        variant="ghost"
        asChild
        className="mb-4 -ml-2 sm:hidden"
      >
        <Link href="/products">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver
        </Link>
      </Button>

      {/* Breadcrumb - Desktop */}
      <Breadcrumb className="mb-6 hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Productos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/products?category=${product.category}`}>
              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] truncate">
              {product.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product Content */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductDetail product={product} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Productos Relacionados</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
