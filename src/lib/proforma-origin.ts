// Texto corto de dónde salió una proforma, para la lista y el detalle.
export type ProformaSource = "CALCULADORA" | "CARRITO" | "VENDEDOR"

export function proformaOriginLabel(p: {
  source?: ProformaSource | null
  calculator?: { name: string } | null
  createdBySellerName?: string | null
}): string {
  if (p.source === "CARRITO") return "Carrito"
  if (p.source === "VENDEDOR") return `Vendedor: ${p.createdBySellerName ?? "—"}`
  return p.calculator?.name ?? "Calculadora"
}
