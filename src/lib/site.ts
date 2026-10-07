/**
 * Datos del negocio para SEO (metadatos, JSON-LD, sitemap, llms.txt).
 *
 * Es el ÚNICO lugar donde viven el dominio, la dirección, el teléfono y el
 * horario para buscadores e IA. Para reutilizar el proyecto en otra tienda,
 * se cambia este archivo (y la variable NEXT_PUBLIC_SITE_URL).
 *
 * Importante para SEO local: nombre, dirección y teléfono deben ser IGUALES
 * aquí, en el pie de página, en /contacto y en Google Business Profile.
 *
 * Datos oficiales confirmados por el dueño (2026-10-07): nombre «Tumbados
 * Zumba», Avenida 25 de Agosto y Galápagos, La Troncal, Cañar; teléfono y
 * WhatsApp +593 99 711 9881; lunes a viernes 7:30–17:00, sábados 7:30–16:00,
 * domingos cerrado; correo tumbadoszumba2508@gmail.com.
 */

/**
 * Dominio público. Debe ser EXACTAMENTE el que responde 200 en producción:
 * tumbadoszumba.com redirige (308) a www.tumbadoszumba.com, así que el
 * dominio oficial es el de `www`. Si algún día se cambia el dominio principal
 * en Vercel, se cambia aquí o con NEXT_PUBLIC_SITE_URL.
 * (NEXT_PUBLIC_APP_URL apunta a localhost en desarrollo, por eso no se usa.)
 */
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tumbadoszumba.com").replace(/\/+$/, "")

export const SITE = {
  name: "Tumbados Zumba",
  alternateName: "TumbadosZumba",
  url: siteUrl,
  locale: "es_EC",
  language: "es-EC",
  defaultTitle: "Tumbados Zumba | Gypsum, cielo raso PVC y acabados en La Troncal, Ecuador",
  description:
    "Placas de yeso (gypsum), cielo raso y paneles de PVC, perfilería, molduras, iluminación LED y herramientas para tumbados. Tienda e instalación en La Troncal, Cañar. Envíos en Ecuador.",
  /** Teléfono oficial = WhatsApp (mismo número). Formato internacional para enlaces y datos estructurados. */
  phone: "+593997119881",
  /** Cómo se muestra el teléfono a las personas. */
  phoneDisplay: "+593 99 711 9881",
  /** Mismo número sin «+» ni espacios, para enlaces wa.me. */
  whatsapp: "593997119881",
  email: "tumbadoszumba2508@gmail.com",
  address: {
    street: "Avenida 25 de Agosto y Galápagos",
    city: "La Troncal",
    region: "Cañar",
    countryCode: "EC",
    country: "Ecuador",
  },
  /** Horario oficial para buscadores (schema.org): lunes a viernes y sábados. Domingo cerrado. */
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:30", closes: "17:00" },
    { days: ["Saturday"], opens: "07:30", closes: "16:00" },
  ],
  /** Horario oficial en texto para mostrar en la web. */
  hoursText: {
    weekdays: "Lunes a viernes: 7:30 AM - 5:00 PM",
    saturday: "Sábados: 7:30 AM - 4:00 PM",
    sunday: "Domingos: cerrado",
    /** Para frases corridas (preguntas frecuentes, llms.txt). */
    summary: "lunes a viernes de 7:30 a 17:00 y sábados de 7:30 a 16:00 (domingos cerrado)",
    /** Versión corta de una sola línea (formularios, descripciones). */
    short: "Lun – Vie 7:30 – 17:00 · Sáb 7:30 – 16:00",
  },
  social: [
    "https://www.facebook.com/share/199R335D7Z/",
    "https://www.tiktok.com/@tumbados_zumba",
  ],
  logo: "/logo-light.png",
  keywords: [
    "tumbados",
    "tumbados La Troncal",
    "gypsum",
    "placa de yeso",
    "drywall Ecuador",
    "cielo raso PVC",
    "cielo raso vinil",
    "paneles de pared PVC",
    "perfilería metálica",
    "molduras",
    "iluminación LED",
    "herramientas para tumbados",
    "instalación de tumbados",
    "La Troncal",
    "Cañar",
    "Ecuador",
  ],
} as const

/** Dirección completa con país (PDF, llms.txt). */
export const ADDRESS_LINE = `${SITE.address.street}, ${SITE.address.city}, ${SITE.address.region}, ${SITE.address.country}`

/** Dirección como se muestra en la web (pie de página, contacto, páginas legales). */
export const ADDRESS_SHORT = `${SITE.address.street}, ${SITE.address.city}, ${SITE.address.region}`

/** URL absoluta a partir de una ruta («/products/x» → «https://dominio/products/x»). */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`
}

export const productPath = (slug: string) => `/products/${slug}`
export const categoryPath = (slug: string) => `/categoria/${slug}`
