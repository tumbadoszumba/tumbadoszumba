import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// Búsqueda de productos en PostgreSQL (la usan el buscador del encabezado y
// /products?search=). Requiere la migración 20261007100000_search_trgm_unaccent.
//
// Cada palabra escrita tiene que encontrarse en el producto por alguno de estos
// caminos:
//  1. Texto completo en español (searchVector): plurales, tildes y palabras a
//     medio escribir ("torn" → tornillo). Incluye los sinónimos de abajo.
//  2. Trigramas (pg_trgm): errores de tipeo ("gipsum" → gypsum, "alanbre" →
//     alambre) en el nombre, la categoría o la marca.
// El orden es por relevancia: primero lo que coincide en el nombre.

// Sinónimos del oficio (Ecuador). Cada grupo se trata como la misma palabra.
const SYNONYM_GROUPS: string[][] = [
  ["placa", "plancha", "lamina", "tablero"],
  ["gypsum", "yeso", "drywall", "cartonyeso", "gyplac"],
  ["flexometro", "cinta metrica", "cinta de medir"],
  ["tumbado", "cielo raso", "cielorraso", "techo falso"],
  ["pvc", "vinil", "vinilo"],
  ["masilla", "empaste", "pasta"],
  ["perfil", "perfileria", "parante", "canal", "riel"],
  ["tornillo", "autoperforante", "perno"],
  ["brocha", "pincel"],
  ["espatula", "llana"],
  ["led", "foco", "luminaria", "lampara"],
  ["moldura", "cornisa"],
]

const STOPWORDS = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "y", "o",
  "en", "con", "para", "por", "al", "a", "que", "mi", "se",
])

const MAX_WORDS = 6
// Similitud mínima de trigramas para aceptar una palabra con errores.
const FUZZY_THRESHOLD = 0.45

export function normalizeSearch(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function tsTerm(phrase: string) {
  // "cinta metrica" → "(cinta:* & metrica:*)"
  const parts = phrase.split(" ").filter((p) => p && !STOPWORDS.has(p))
  if (parts.length === 0) return null
  const terms = parts.map((p) => `${p}:*`)
  return terms.length === 1 ? terms[0] : `(${terms.join(" & ")})`
}

export function expandSearchTerm(word: string) {
  const group = SYNONYM_GROUPS.find((g) =>
    g.some(
      (s) =>
        s === word ||
        // palabra a medio escribir ("planc" → plancha); solo sinónimos de una palabra
        (!s.includes(" ") && s.length >= 4 && word.length >= 4 && (s.startsWith(word) || word.startsWith(s)))
    )
  )
  const phrases = group ? Array.from(new Set([word, ...group])) : [word]
  const terms = phrases.map(tsTerm).filter((t): t is string => !!t)
  return terms.length === 1 ? terms[0] : `(${terms.join(" | ")})`
}

export function parseSearch(query: string) {
  const normalized = normalizeSearch(query)
  const words = normalized
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w) && (w.length >= 2 || /\d/.test(w)))
    .slice(0, MAX_WORDS)
  return { normalized, words }
}

interface SearchOptions {
  /** La tienda solo muestra productos con stock. */
  inStockOnly?: boolean
  limit?: number
}

/** IDs de productos activos que coinciden con la búsqueda, del más al menos relevante. */
export async function searchProductIds(query: string, { inStockOnly = true, limit = 200 }: SearchOptions = {}) {
  const { normalized, words } = parseSearch(query)
  if (words.length === 0) return []

  const doc = Prisma.sql`public.immutable_unaccent(lower(p.name || ' ' || coalesce(c.name, '') || ' ' || coalesce(b.name, '')))`
  const nameNorm = Prisma.sql`public.immutable_unaccent(lower(p.name))`

  const perWord = words.map(
    (w) => Prisma.sql`(
      p."searchVector" @@ to_tsquery('spanish', ${expandSearchTerm(w)})
      OR ${doc} LIKE ${"%" + w + "%"}
      OR word_similarity(${w}, ${doc}) >= ${FUZZY_THRESHOLD}
    )`
  )
  const anyWord = words.map(expandSearchTerm).join(" | ")

  let rows: { id: string }[]
  try {
    rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM "products" p
    LEFT JOIN "categories" c ON c.id = p."categoryId"
    LEFT JOIN "brands" b ON b.id = p."brandId"
    WHERE p."isActive" = true
      ${inStockOnly ? Prisma.sql`AND p.stock > 0` : Prisma.empty}
      AND ${Prisma.join(perWord, " AND ")}
    ORDER BY
      (${nameNorm} LIKE ${normalized + "%"}) DESC,
      ts_rank(p."searchVector", to_tsquery('spanish', ${anyWord})) * 2
        + word_similarity(${normalized}, ${nameNorm}) DESC,
      p.name ASC
    LIMIT ${limit}
  `
  } catch (error) {
    // Sin la migración (extensiones pg_trgm/unaccent) se usa la búsqueda anterior
    // para que el buscador nunca deje de funcionar.
    if (!isMissingSearchMigration(error)) throw error
    if (!warnedMissingMigration) {
      warnedMissingMigration = true
      console.warn("[search] Falta la migración 20261007100000_search_trgm_unaccent: se usa la búsqueda básica.")
    }
    rows = await legacySearch(query.trim(), inStockOnly, limit)
  }
  return rows.map((r) => r.id)
}

let warnedMissingMigration = false

function isMissingSearchMigration(error: unknown) {
  const text = String((error as { message?: string })?.message ?? error)
  return /immutable_unaccent|word_similarity|does not exist|42883/i.test(text)
}

function legacySearch(q: string, inStockOnly: boolean, limit: number) {
  return prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM "products" p
    LEFT JOIN "categories" c ON c.id = p."categoryId"
    LEFT JOIN "brands" b ON b.id = p."brandId"
    WHERE p."isActive" = true
      ${inStockOnly ? Prisma.sql`AND p.stock > 0` : Prisma.empty}
      AND (
        p."searchVector" @@ plainto_tsquery('spanish', ${q})
        OR c.name ILIKE ${"%" + q + "%"}
        OR b.name ILIKE ${"%" + q + "%"}
        OR p.specs::text ILIKE ${"%" + q + "%"}
        OR p.name ILIKE ${"%" + q + "%"}
      )
    ORDER BY (p.name ILIKE ${q + "%"}) DESC, p.name ASC
    LIMIT ${limit}
  `
}
