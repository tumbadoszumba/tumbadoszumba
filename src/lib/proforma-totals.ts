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

// Los precios guardados YA incluyen el IVA: el valor total es lo que suman los
// items más/menos el ajuste (descuento o recargo), y de ahí se desglosa el
// subtotal sin IVA y el IVA (subtotal + IVA = total).
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
  const total = Math.round((itemsTotal + adjustmentAmount) * 100) / 100
  const subtotal = Math.round((total / (1 + IVA_RATE)) * 100) / 100
  const iva = Math.round((total - subtotal) * 100) / 100
  return { itemsTotal, adjustmentAmount, subtotal, iva, total }
}
