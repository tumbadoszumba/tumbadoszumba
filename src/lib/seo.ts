import type { Metadata } from "next"
import type { Product } from "@/types"
import { SITE, absoluteUrl, productPath } from "@/lib/site"

/** Texto plano, una sola línea, cortado en límite de palabra. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[ ,.;:–-]+$/, "")}…`
}

export const BUSINESS_ID = `${SITE.url}/#business`
export const WEBSITE_ID = `${SITE.url}/#website`

const robotsIndex = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
    "max-video-preview": -1,
  },
}

interface PageMetaInput {
  title: string
  description: string
  /** Ruta canónica («/contacto»). */
  path: string
  /** Imagen para compartir; si falta se usa la imagen por defecto (opengraph-image). */
  image?: string
  /** `noindex` para páginas privadas, vacías o duplicadas. */
  noindex?: boolean
  type?: "website" | "article"
}

/**
 * Metadatos de una página con todo coherente (título, descripción, canonical,
 * Open Graph y Twitter). Next NO fusiona openGraph entre layout y página, por
 * eso cada página debe traer el objeto completo: este helper lo garantiza.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex,
  type = "website",
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : robotsIndex,
    openGraph: {
      type,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      title,
      description,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

/** Metadatos para páginas privadas (carrito, checkout, perfil, admin, login). */
export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
}

/** Negocio local (tienda + instalación) y sitio web. Va en el layout raíz. */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["HardwareStore", "LocalBusiness"],
        "@id": BUSINESS_ID,
        name: SITE.name,
        alternateName: SITE.alternateName,
        description: SITE.description,
        url: SITE.url,
        logo: absoluteUrl(SITE.logo),
        image: absoluteUrl(SITE.logo),
        telephone: SITE.phone,
        email: SITE.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.city,
          addressRegion: SITE.address.region,
          addressCountry: SITE.address.countryCode,
        },
        areaServed: [
          { "@type": "City", name: SITE.address.city },
          { "@type": "AdministrativeArea", name: SITE.address.region },
          { "@type": "Country", name: SITE.address.country },
        ],
        openingHoursSpecification: SITE.hours.map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: h.days,
          opens: h.opens,
          closes: h.closes,
        })),
        sameAs: SITE.social,
        knowsAbout: [
          "Placas de yeso (gypsum, drywall)",
          "Tumbados y cielos rasos",
          "Cielo raso y paneles de pared de PVC",
          "Perfilería metálica para construcción en seco",
          "Instalación de tumbados y paredes de gypsum",
        ],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE.url,
        name: SITE.name,
        alternateName: SITE.alternateName,
        inLanguage: SITE.language,
        publisher: { "@id": BUSINESS_ID },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE.url}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/**
 * Ficha de producto. Sin `aggregateRating`: el rating del sistema es un valor
 * por defecto, no reseñas reales, y Google penaliza las valoraciones falsas.
 */
export function productJsonLd(product: Product, categoryName: string) {
  const url = absoluteUrl(productPath(product.slug))
  const brand =
    product.brand && !/^sin marca$/i.test(product.brand.trim()) ? product.brand : undefined
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: truncate(product.description || product.name, 500),
    url,
    sku: product.id,
    category: categoryName,
    ...(product.images.length ? { image: product.images.map((i) => absoluteUrl(i)) } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(product.showPrice !== false
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "USD",
            price: product.price.toFixed(2),
            availability:
              product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@id": BUSINESS_ID },
          },
        }
      : {}),
  }
}

export function itemListJsonLd(name: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(productPath(p.slug)),
      name: p.name,
    })),
  }
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}
