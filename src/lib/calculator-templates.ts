export type CalculatorInputType = "number" | "select"

export interface CalculatorInputOption {
  label: string
  value: string
}

export interface CalculatorInput {
  key: string
  label: string
  type: CalculatorInputType
  unit?: string
  required?: boolean
  placeholder?: string
  defaultValue?: string
  min?: number
  step?: number
  options?: CalculatorInputOption[]
}

export interface CalculatorTemplate {
  name: string
  description: string
  inputs: CalculatorInput[]
}

const area: CalculatorInput = {
  key: "area",
  label: "Área a instalar",
  type: "number",
  unit: "m²",
  required: true,
  placeholder: "Ej. 32",
  min: 0.1,
  step: 0.1,
}

const height: CalculatorInput = {
  key: "height",
  label: "Altura de pared",
  type: "number",
  unit: "m",
  required: true,
  defaultValue: "2.4",
  min: 0.1,
  step: 0.1,
}

const studSpacing: CalculatorInput = {
  key: "stud_spacing",
  label: "Separación entre studs",
  type: "select",
  required: true,
  defaultValue: "0.610",
  options: [
    { label: "0,610 m", value: "0.610" },
    { label: "0,407 m", value: "0.407" },
    { label: "0,305 m", value: "0.305" },
  ],
}

const cloneInputs = (inputs: CalculatorInput[]) => structuredClone(inputs)

export const CALCULATOR_TEMPLATES: CalculatorTemplate[] = [
  {
    name: "Tumbado Gypsum Plano",
    description: "Sistema de tumbado con variante de plancha.",
    inputs: [
      area,
      {
        key: "board_variant",
        label: "Variante de plancha",
        type: "select",
        required: true,
        defaultValue: "regular-12",
        options: [
          { label: 'Regular 1/2"', value: "regular-12" },
          { label: 'Exterior 1/2"', value: "exterior-12" },
          { label: 'Regular 5/8"', value: "regular-58" },
          { label: 'Guard 1/2" (humedad)', value: "guard-12" },
          { label: 'Guard 5/8" (humedad)', value: "guard-58" },
        ],
      },
    ],
  },
  {
    name: "Cielo Raso Estructura Vista",
    description: "Sistema de cielo raso con grilla visible.",
    inputs: [area, { key: "grid", label: "Variante de grilla", type: "select", required: true, defaultValue: "2x2", options: [{ label: "2×2", value: "2x2" }, { label: "2×4", value: "2x4" }] }],
  },
  {
    name: "Pared Doble Forramiento",
    description: "Forramiento de pared con estructura de studs.",
    inputs: [area, height, { key: "board_variant", label: "Variante de plancha", type: "select", required: true, defaultValue: "light-12", options: [{ label: 'Light 1/2"', value: "light-12" }, { label: 'Fire C 1/2"', value: "fire-c-12" }, { label: 'Fire X 5/8"', value: "fire-x-58" }, { label: 'Guard 1/2" (humedad)', value: "guard-12" }, { label: 'Guard 5/8" (humedad)', value: "guard-58" }] }, studSpacing],
  },
  {
    name: "Pared Forramiento Una Cara",
    description: "Forramiento de pared a una cara.",
    inputs: [area, height, { key: "board_variant", label: "Variante de plancha", type: "select", required: true, defaultValue: "light-12", options: [{ label: 'Light 1/2"', value: "light-12" }, { label: 'Guard 1/2" (humedad)', value: "guard-12" }, { label: 'Guard 5/8" (humedad)', value: "guard-58" }] }, studSpacing],
  },
  {
    name: "Pared Fibrocemento Interiores",
    description: "Pared interior de fibrocemento.",
    inputs: [area, height, studSpacing],
  },
  {
    name: "Pegado de Plancha / Enchape",
    description: "Sistema de plancha pegada o enchape.",
    inputs: [area, { key: "board_variant", label: "Variante de plancha", type: "select", required: true, defaultValue: "regular-12", options: [{ label: 'Regular 1/2"', value: "regular-12" }, { label: 'Guard 1/2" (humedad)', value: "guard-12" }] }],
  },
  { name: "Cielo Raso PVC", description: "Sistema de cielo raso en PVC.", inputs: [area] },
  {
    name: "WPC Interiores",
    description: "Revestimiento WPC para interiores.",
    inputs: [area, { key: "panel_and_fixing", label: "Tamaño y fijación", type: "select", required: true, defaultValue: "17-mechanical", options: [{ label: "17 cm · mecánica", value: "17-mechanical" }, { label: "17 cm · adhesiva", value: "17-adhesive" }, { label: "19,5 cm · mecánica", value: "195-mechanical" }, { label: "19,5 cm · adhesiva", value: "195-adhesive" }] }],
  },
  {
    name: "WPC Exteriores",
    description: "Revestimiento WPC para exteriores.",
    inputs: [area, { key: "fixing", label: "Tipo de fijación", type: "select", required: true, defaultValue: "mechanical", options: [{ label: "Mecánica", value: "mechanical" }, { label: "Adhesiva", value: "adhesive" }] }],
  },
  {
    name: "Marmoleados PVC",
    description: "Paneles PVC decorativos tipo mármol.",
    inputs: [area, { key: "panel_size", label: "Tamaño del panel", type: "select", required: true, defaultValue: "244", options: [{ label: "Panel 2,44 m", value: "244" }, { label: "Panel 2,90 m", value: "290" }] }],
  },
]

export function getCalculatorTemplate(name: string) {
  const template = CALCULATOR_TEMPLATES.find((item) => item.name === name)
  return template ? { ...template, inputs: cloneInputs(template.inputs) } : null
}
