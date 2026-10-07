import type { MetadataRoute } from "next"
import { absoluteUrl, categoryPath, productPath } from "@/lib/site"
import { getSitemapData, type SitemapData } from "@/lib/queries-seo"

export const revalidate = 3600

/** Páginas públicas fijas: ruta, frecuencia y prioridad. */
const staticPages: { path: string; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/ofertas", changeFrequency: "daily", priority: 0.8 },
  { path: "/instalaciones", changeFrequency: "monthly", priority: 0.8 },
  { path: "/diseno-e-ideas", changeFrequency: "weekly", priority: 0.6 },
  { path: "/contacto", changeFrequency: "yearly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = staticPages.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))

  // Si la base de datos no responde, el sitemap sigue publicando las páginas fijas.
  let data: SitemapData = { products: [], categories: [] }
  try {
    data = await getSitemapData()
  } catch (error) {
    console.error("sitemap: no se pudo leer el catálogo", error)
  }

  // Una categoría sin productos sería contenido vacío: no se publica.
  for (const c of data.categories) {
    if (c.productCount === 0) continue
    entries.push({
      url: absoluteUrl(categoryPath(c.slug)),
      lastModified: new Date(c.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    })
  }

  for (const p of data.products) {
    entries.push({
      url: absoluteUrl(productPath(p.slug)),
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
      images: p.images.slice(0, 5),
    })
  }

  return entries
}
