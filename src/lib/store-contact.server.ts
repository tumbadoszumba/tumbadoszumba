import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { DEFAULT_STORE_CONTACT, mergeStoreContact, type StoreContact } from "@/lib/store-contact"

// Se guarda como JSON en AppSetting (no necesita migración).
export const STORE_CONTACT_SETTING_KEY = "store_contact"

/**
 * Datos de contacto vigentes de la tienda. Con caché y el tag "store-contact":
 * al guardar en el admin se invalida y todo el sitio muestra el valor nuevo.
 * Si la BD falla o no hay nada guardado, usa los valores de `site.ts`.
 */
export const getStoreContact = unstable_cache(
  async (): Promise<StoreContact> => {
    try {
      const row = await prisma.appSetting.findUnique({ where: { key: STORE_CONTACT_SETTING_KEY } })
      if (!row) return DEFAULT_STORE_CONTACT
      return mergeStoreContact(JSON.parse(row.value))
    } catch {
      return DEFAULT_STORE_CONTACT
    }
  },
  ["store-contact"],
  { tags: [CACHE_TAGS.storeContact], revalidate: 300 }
)
