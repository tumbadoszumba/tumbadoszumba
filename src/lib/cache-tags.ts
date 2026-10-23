import { revalidateTag } from "next/cache"

/**
 * Tags usados por src/lib/queries.ts. Centralizados acá para no repetir
 * strings sueltos en cada ruta de API que escribe datos.
 */
export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  brands: "brands",
  storeContact: "store-contact",
} as const

// Next 16 pide un segundo argumento "profile" en revalidateTag. La propia
// librería sugiere "max" en su mensaje de deprecación, pero probándolo NO
// fuerza una purga inmediata (solo agenda revalidación en segundo plano).
// Lo que sí replica el comportamiento clásico de invalidar YA es pasar
// { expire: 0 } — ver node_modules/next/dist/.../revalidate.js: con
// profile.expire === 0 marca la ruta para revalidación total inmediata,
// igual que hacía revalidateTag(tag) de un solo argumento.
const IMMEDIATE = { expire: 0 }

/** Llamar después de crear/editar/borrar un producto. */
export function invalidateProducts() {
  revalidateTag(CACHE_TAGS.products, IMMEDIATE)
}

/** Llamar después de crear/editar/borrar una categoría. */
export function invalidateCategories() {
  revalidateTag(CACHE_TAGS.categories, IMMEDIATE)
}

/** Llamar después de guardar el teléfono, correo o calle de la tienda. */
export function invalidateStoreContact() {
  revalidateTag(CACHE_TAGS.storeContact, IMMEDIATE)
}

/** Llamar después de crear/editar/borrar una marca. */
export function invalidateBrands() {
  revalidateTag(CACHE_TAGS.brands, IMMEDIATE)
}
