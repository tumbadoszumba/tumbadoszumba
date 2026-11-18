/**
 * Normaliza números de teléfono ecuatorianos al formato internacional +593XXXXXXXXX.
 *
 * Reglas:
 *   09XXXXXXXX  (10 dígitos, móvil/fijo local)   → +5939XXXXXXXX
 *   9XXXXXXXX   (9 dígitos, sin cero inicial)     → +5939XXXXXXXX
 *   593XXXXXXXXX (12 dígitos sin +)               → +593XXXXXXXXX
 *   +593…       ya está bien, solo limpia espacios
 *
 * Cualquier otro formato se devuelve sin cambios (internacionales, etc.).
 */
export function normalizeEcuadorPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw.trim()
  if (!cleaned) return null

  const digits = cleaned.replace(/\D/g, "")
  if (digits.length === 0) return null

  // Ya tiene +593
  if (cleaned.startsWith("+593")) return "+" + digits

  // 593… sin + (12 dígitos)
  if (digits.startsWith("593") && digits.length === 12) return "+" + digits

  // Formato local 0X… (10 dígitos: 09… móvil o 02–07 fijo)
  if (digits.startsWith("0") && digits.length === 10) return "+593" + digits.slice(1)

  // 9 dígitos sin cero inicial
  if (digits.startsWith("9") && digits.length === 9) return "+593" + digits

  return cleaned
}

/**
 * Clave de agrupación canónica para deduplicar clientes por teléfono.
 * Dos números que apunten al mismo abonado devuelven la misma clave.
 */
export function phoneGroupKey(phone: string | null | undefined): string | null {
  const normalized = normalizeEcuadorPhone(phone)
  if (!normalized) return null
  return normalized.replace(/\D/g, "")
}
