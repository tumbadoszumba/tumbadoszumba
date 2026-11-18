/**
 * Script de migración única: normaliza los teléfonos de proformas y usuarios
 * al formato internacional +593XXXXXXXXX.
 *
 * Ejecutar una sola vez:
 *   npx dotenv -e .env -- npx tsx prisma/normalize-phones.ts
 * O con la variable de entorno directa:
 *   DATABASE_URL="..." npx tsx prisma/normalize-phones.ts
 */
import { readFileSync } from "fs"
import { resolve } from "path"

// Carga .env manualmente antes de cualquier import de Prisma
const envPath = resolve(process.cwd(), ".env")
try {
  const lines = readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env no encontrado — se asume que DATABASE_URL ya está en el entorno
}

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

function normalizeEcuadorPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw.trim()
  if (!cleaned) return null
  const digits = cleaned.replace(/\D/g, "")
  if (digits.length === 0) return null
  if (cleaned.startsWith("+593")) return "+" + digits
  if (digits.startsWith("593") && digits.length === 12) return "+" + digits
  if (digits.startsWith("0") && digits.length === 10) return "+593" + digits.slice(1)
  if (digits.startsWith("9") && digits.length === 9) return "+593" + digits
  return cleaned
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("Conectado a la base de datos.")

  // 1. Proformas con contactPhone
  const proformas = await prisma.proforma.findMany({
    where: { contactPhone: { not: null } },
    select: { id: true, contactPhone: true },
  })

  let proformaUpdated = 0
  for (const p of proformas) {
    const normalized = normalizeEcuadorPhone(p.contactPhone)
    if (normalized && normalized !== p.contactPhone) {
      await prisma.proforma.update({ where: { id: p.id }, data: { contactPhone: normalized } })
      proformaUpdated++
      console.log(`  proforma ${p.id.slice(0, 8)}…: "${p.contactPhone}" → "${normalized}"`)
    }
  }
  console.log(`\nProformas actualizadas: ${proformaUpdated} de ${proformas.length}`)

  // 2. Usuarios con phone
  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true, name: true },
  })

  let usersUpdated = 0
  for (const u of users) {
    const normalized = normalizeEcuadorPhone(u.phone)
    if (normalized && normalized !== u.phone) {
      await prisma.user.update({ where: { id: u.id }, data: { phone: normalized } })
      usersUpdated++
      console.log(`  usuario "${u.name}": "${u.phone}" → "${normalized}"`)
    }
  }
  console.log(`Usuarios actualizados: ${usersUpdated} de ${users.length}`)

  await prisma.$disconnect()
  await pool.end()
  console.log("\n✓ Normalización completada.")
}

main().catch((e) => { console.error(e); process.exit(1) })
