import { SITE, ADDRESS_LINE, absoluteUrl, categoryPath, productPath } from "@/lib/site"
import { getSitemapData } from "@/lib/queries-seo"
import { getBestSellingProducts } from "@/lib/queries"
import { truncate } from "@/lib/seo"

export const revalidate = 3600

/**
 * /llms.txt — resumen en Markdown pensado para asistentes de IA (ChatGPT,
 * Claude, Perplexity…): quién es el negocio, dónde está y qué páginas
 * importan. Se genera con el catálogo real, así nunca queda desactualizado.
 */
export async function GET() {
  let categories: { slug: string; name: string; productCount: number }[] = []
  let products: { name: string; slug: string; price: number; brand: string; showPrice?: boolean }[] = []
  try {
    const [sitemap, featured] = await Promise.all([getSitemapData(), getBestSellingProducts(12)])
    categories = sitemap.categories.filter((c) => c.productCount > 0)
    products = featured
  } catch (error) {
    console.error("llms.txt: no se pudo leer el catálogo", error)
  }

  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> Tienda e instalación de tumbados en ${SITE.address.city}, ${SITE.address.region}, ${SITE.address.country}. Vende placas de yeso (gypsum/drywall), cielo raso y paneles de pared de PVC, perfilería metálica, molduras, iluminación LED y herramientas para construcción en seco. También instala tumbados y paredes de gypsum.`,
    "",
    "## Datos del negocio",
    `- Nombre: ${SITE.name} (${SITE.alternateName})`,
    `- Dirección: ${ADDRESS_LINE}`,
    `- Teléfono / WhatsApp: ${SITE.phone}`,
    `- Correo: ${SITE.email}`,
    `- Horario: ${SITE.hoursText.summary} (hora de Ecuador)`,
    `- Sitio web: ${SITE.url}`,
    "- Moneda de los precios: dólares estadounidenses (USD)",
    ...SITE.social.map((s) => `- Redes: ${s}`),
    "",
    "## Páginas principales",
    `- [Catálogo completo](${absoluteUrl("/products")}): todos los productos`,
    `- [Ofertas](${absoluteUrl("/ofertas")}): productos con descuento`,
    `- [Instalaciones](${absoluteUrl("/instalaciones")}): trabajos de instalación de tumbados y gypsum`,
    `- [Ideas de diseño](${absoluteUrl("/diseno-e-ideas")}): inspiración para tumbados y acabados`,
    `- [Contacto](${absoluteUrl("/contacto")}): dirección, horario y formulario`,
  ]

  if (categories.length) {
    lines.push("", "## Categorías")
    for (const c of categories) {
      lines.push(`- [${c.name}](${absoluteUrl(categoryPath(c.slug))}): ${c.productCount} producto(s)`)
    }
  }

  if (products.length) {
    lines.push("", "## Productos destacados")
    for (const p of products) {
      const price = p.showPrice === false ? "" : ` — $${p.price.toFixed(2)} USD`
      const brand = p.brand && !/^sin marca$/i.test(p.brand) ? ` (${p.brand})` : ""
      lines.push(`- [${truncate(p.name, 90)}](${absoluteUrl(productPath(p.slug))})${brand}${price}`)
    }
  }

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
