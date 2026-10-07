import type { Metadata } from "next"
import { ProductsPageClient } from "@/components/products/ProductsPageClient"
import { getCategories } from "@/lib/queries"
import { categoryPath } from "@/lib/site"
import { pageMetadata } from "@/lib/seo"
import { categoryCopy } from "@/lib/seo-copy"

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string }>
}

const baseTitle = "Catálogo de productos para tumbados y gypsum en La Troncal, Ecuador"
const baseDescription =
  "Placas de yeso, cielo raso y paneles de PVC, perfilería, molduras, iluminación LED y herramientas para tumbados. Compra en línea en Tumbados Zumba, La Troncal, Ecuador."

/**
 * El listado filtra en el navegador (no se tocó), así que las variantes con
 * ?category= o ?search= son la misma página. Para buscadores:
 * - una categoría apunta como canonical a su página /categoria/[slug];
 * - una búsqueda interna no se indexa.
 */
export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { category, search } = await searchParams

  if (search) {
    return pageMetadata({ title: baseTitle, description: baseDescription, path: "/products", noindex: true })
  }

  if (category) {
    const wanted = decodeURIComponent(category).trim().toLowerCase()
    const found = (await getCategories()).find(
      (c) => c.slug.toLowerCase() === wanted || c.name.trim().toLowerCase() === wanted
    )
    if (found) {
      const copy = categoryCopy(found.slug, found.name)
      return pageMetadata({
        title: copy.title,
        description: copy.description,
        path: categoryPath(found.slug),
      })
    }
  }

  return pageMetadata({ title: baseTitle, description: baseDescription, path: "/products" })
}

export default function ProductsPage() {
  return <ProductsPageClient />
}
