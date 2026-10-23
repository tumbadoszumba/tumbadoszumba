import { SITE } from "@/lib/site"

/**
 * Datos de contacto de la tienda que el admin puede cambiar desde
 * Configuración → Información de la Tienda: teléfono (que es también el
 * WhatsApp), correo y calle. Ciudad, provincia y país siguen fijos en
 * `src/lib/site.ts` porque alimentan todo el SEO local.
 *
 * Este archivo es puro (sin base de datos) para poder usarse también en
 * componentes de cliente. La lectura de la BD está en `store-contact.server.ts`.
 */
export interface StoreContact {
  /** Formato internacional con «+», para `tel:` y datos estructurados. */
  phone: string
  /** Cómo se muestra a las personas. */
  phoneDisplay: string
  /** Solo dígitos, para enlaces wa.me. */
  whatsapp: string
  email: string
  street: string
}

export const DEFAULT_STORE_CONTACT: StoreContact = {
  phone: SITE.phone,
  phoneDisplay: SITE.phoneDisplay,
  whatsapp: SITE.whatsapp,
  email: SITE.email,
  street: SITE.address.street,
}

/**
 * Convierte lo que escribe el admin («0969903466», «+593 96 990 3466»,
 * «593969903466»…) a los tres formatos del teléfono. Devuelve null si no
 * parece un número válido.
 */
export function normalizePhone(input: string): Pick<StoreContact, "phone" | "phoneDisplay" | "whatsapp"> | null {
  let digits = input.replace(/\D/g, "")
  // Número local de Ecuador con 0 inicial (0969903466) → código de país 593.
  if (digits.startsWith("0") && digits.length === 10) digits = `593${digits.slice(1)}`
  if (digits.length < 8 || digits.length > 15) return null

  const display =
    digits.startsWith("593") && digits.length === 12
      ? `+593 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
      : `+${digits}`
  return { phone: `+${digits}`, phoneDisplay: display, whatsapp: digits }
}

/** Dirección como se muestra en la web: calle, ciudad, provincia. */
export const addressShort = (c: StoreContact) => `${c.street}, ${SITE.address.city}, ${SITE.address.region}`

/** Dirección completa con país (PDF, llms.txt). */
export const addressLine = (c: StoreContact) => `${addressShort(c)}, ${SITE.address.country}`

/** Enlace a Google Maps (búsqueda por nombre y dirección). */
export const mapsUrl = (c: StoreContact) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE.name}, ${addressLine(c)}`)}`

/** Enlace de WhatsApp al número de la tienda con un mensaje ya escrito. */
export const whatsappUrl = (c: StoreContact, message: string) =>
  `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(message)}`

/** Mezcla lo guardado con los valores por defecto, ignorando lo que venga mal. */
export function mergeStoreContact(saved: unknown): StoreContact {
  const base = { ...DEFAULT_STORE_CONTACT }
  if (!saved || typeof saved !== "object") return base
  const s = saved as Record<string, unknown>
  const phone = typeof s.phone === "string" ? normalizePhone(s.phone) : null
  return {
    ...base,
    ...(phone ?? {}),
    email: typeof s.email === "string" && s.email.trim() ? s.email.trim() : base.email,
    street: typeof s.street === "string" && s.street.trim() ? s.street.trim() : base.street,
  }
}
