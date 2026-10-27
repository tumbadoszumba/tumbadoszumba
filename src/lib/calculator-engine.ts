// Motor de la calculadora: cantidad = área × rendimiento por m², redondeado hacia
// arriba. Cada material puede tener reglas que lo ajustan según lo que el cliente
// elige (variante de plancha, separación de studs, altura de pared).

// Valores de referencia con los que se miden los rendimientos de las paredes.
export const BASE_STUD_SPACING = 0.61
export const BASE_WALL_HEIGHT = 2.4

export interface MaterialRules {
  // El material solo aparece si cada campo vale alguno de estos valores.
  when?: Record<string, string[]>
  // Rendimiento por m² distinto según el valor de un campo (si el valor no está,
  // se usa el rendimiento base del material).
  yieldBy?: { key: string; values: Record<string, number> }
  // Multiplica por (0,61 / separación de studs): más separación, menos studs.
  perSpacing?: boolean
  // Multiplica por (2,40 / altura): más alta la pared, menos tracks por m².
  perHeight?: boolean
}

export interface EngineMaterial {
  yield: number | string
  rules?: MaterialRules | null
}

const ceil = (x: number) => Math.ceil(x - 1e-9)

export function appliesToValues(rules: MaterialRules | null | undefined, values: Record<string, string>) {
  if (!rules?.when) return true
  return Object.entries(rules.when).every(([key, allowed]) => allowed.includes(values[key] ?? ""))
}

// Devuelve la cantidad a pedir, o null si el material no aplica a esta combinación.
export function calcMaterialQty(material: EngineMaterial, area: number, values: Record<string, string>): number | null {
  const rules = material.rules ?? undefined
  if (!appliesToValues(rules, values)) return null

  let rate = Number(material.yield)
  if (rules?.yieldBy) {
    const override = rules.yieldBy.values[values[rules.yieldBy.key] ?? ""]
    if (override !== undefined) rate = Number(override)
  }
  if (rules?.perSpacing) {
    const spacing = parseFloat(values.stud_spacing)
    if (spacing > 0) rate *= BASE_STUD_SPACING / spacing
  }
  if (rules?.perHeight) {
    const height = parseFloat(values.height)
    if (height > 0) rate *= BASE_WALL_HEIGHT / height
  }
  return ceil(area * rate)
}
