// Límite de solicitudes por clave (ej. IP) con ventana fija, en memoria.
// En Vercel cada instancia tiene su propia memoria, así que es un freno básico
// contra envíos repetidos, no una protección exacta.
const hits = new Map<string, { count: number; resetAt: number }>()

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()

  // Limpieza perezosa para que el mapa no crezca sin límite.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
  }

  const entry = hits.get(key)
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > limit
}

export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "desconocida"
}
