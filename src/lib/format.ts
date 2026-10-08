// Precios unitarios: se guardan con hasta 3 decimales (tornillos y materiales
// de centavos, ej. $0.015). Se muestran con 2 decimales, o con 3 solo si el
// precio los usa. Los totales (carrito, pedidos, proformas) siguen con 2.
export function formatPrice(n: number) {
  const three = n.toFixed(3)
  return three.endsWith("0") ? n.toFixed(2) : three
}

export function roundPrice(n: number) {
  return Math.round(n * 1000) / 1000
}

export function hasMaxThreeDecimals(n: number) {
  return Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6
}
