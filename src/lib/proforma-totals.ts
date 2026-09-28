export const IVA_RATE = 0.15

export function computeAdjustment(
  itemsTotal: number,
  adjustmentType: string | null,
  adjustmentDirection: string | null,
  adjustmentValue: number | null
) {
  if (!adjustmentType || !adjustmentDirection || adjustmentValue == null) {
    return 0
  }
  const magnitude =
    adjustmentType === "percentage" ? itemsTotal * (adjustmentValue / 100) : adjustmentValue
  return adjustmentDirection === "decrease" ? -magnitude : magnitude
}

// Los precios guardados no incluyen IVA: el IVA se calcula sobre los items
// más/menos el ajuste (descuento o recargo) de la proforma.
export function computeTotals(
  itemsTotal: number,
  adjustmentType: string | null,
  adjustmentDirection: string | null,
  adjustmentValue: number | null
) {
  const adjustmentAmount = computeAdjustment(
    itemsTotal,
    adjustmentType,
    adjustmentDirection,
    adjustmentValue
  )
  const subtotal = itemsTotal + adjustmentAmount
  const iva = subtotal * IVA_RATE
  return { itemsTotal, adjustmentAmount, subtotal, iva, total: subtotal + iva }
}
