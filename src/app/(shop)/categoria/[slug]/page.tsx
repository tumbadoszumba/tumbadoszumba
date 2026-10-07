import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ProductCard } from "@/components/products/ProductCard"
import { JsonLd } from "@/components/seo/JsonLd"
import { getCategoryWithProducts } from "@/lib/queries-seo"
import { getCategories } from "@/lib/queries"
import { categoryPath } from "@/lib/site"
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo"
import { categoryCopy } from "@/lib/seo-copy"

export const revalidate = 60

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getCategoryWithProducts(slug)

  if (!data) {
    return { title: "Categoría no encontrada", robots: { index: false, follow: false } }
  }

  const copy = categoryCopy(data.category.slug, data.category.name)
  return pageMetadata({
    title: copy.title,
    description: copy.description,
    path: categoryPath(data.category.slug),
    image: data.products[0]?.images[0],
    // Una categoría vacía sería contenido pobre: no se indexa
    noindex: data.products.length === 0,
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const data = await getCategoryWithProducts(slug)

  if (!data) notFound()

  const { category, products } = data
  const copy = categoryCopy(category.slug, category.name)
  const otherCategories = (await getCategories()).filter(
    (c) => c.slug !== category.slug && c.productCount > 0
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Productos", path: "/products" },
          { name: category.name, path: categoryPath(category.slug) },
        ])}
      />
      {products.length > 0 && <JsonLd data={itemListJsonLd(copy.h1, products)} />}

      <Breadcrumb className="mb-6">
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
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">{copy.h1}</h1>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground sm:text-base">
          {copy.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </header>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-6 text-center text-muted-foreground">
          Por ahora no hay productos disponibles en esta categoría.{" "}
          <Link href="/products" className="font-medium text-primary underline-offset-4 hover:underline">
            Ver todos los productos
          </Link>
        </p>
      )}

      {otherCategories.length > 0 && (
        <nav aria-label="Otras categorías" className="mt-12">
          <h2 className="mb-3 text-lg font-semibold">Explora otras categorías</h2>
          <ul className="flex flex-wrap gap-2">
            {otherCategories.map((c) => (
              <li key={c.id}>
                <Link
                  href={categoryPath(c.slug)}
                  className="inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
