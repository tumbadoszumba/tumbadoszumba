const UNITS = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ",
  "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
  "VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES", "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS",
  "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
]
const TENS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
const HUNDREDS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
]

function belowThousand(n: number): string {
  if (n === 100) return "CIEN"
  const parts: string[] = []
  const h = Math.floor(n / 100)
  const r = n % 100
  if (h) parts.push(HUNDREDS[h])
  if (r) {
    if (r < 30) {
      parts.push(UNITS[r])
    } else {
      const t = Math.floor(r / 10)
      const u = r % 10
      parts.push(u ? `${TENS[t]} Y ${UNITS[u]}` : TENS[t])
    }
  }
  return parts.join(" ")
}

// Ej: 27.03 -> "VEINTISIETE DOLARES CON 03 CTVS" (soporta hasta 999,999.99).
export function amountToWords(amount: number): string {
  const cents = Math.round(amount * 100)
  const integer = Math.floor(cents / 100)
  const cts = cents % 100

  let words: string
  if (integer === 0) {
    words = "CERO"
  } else if (integer === 1) {
    words = "UN"
  } else {
    const thousands = Math.floor(integer / 1000)
    const rest = integer % 1000
    const parts: string[] = []
    if (thousands) parts.push(thousands === 1 ? "MIL" : `${belowThousand(thousands)} MIL`)
    if (rest) parts.push(belowThousand(rest))
    words = parts.join(" ")
  }

  return `${words} ${integer === 1 ? "DOLAR" : "DOLARES"} CON ${String(cts).padStart(2, "0")} CTVS`
}
