"use client"

import { Input } from "@/components/ui/input"
import { CalculatorInput } from "@/lib/calculator-templates"
import { MaterialRules } from "@/lib/calculator-engine"

interface MaterialRulesEditorProps {
  rules: MaterialRules | null | undefined
  inputs: CalculatorInput[]
  onChange: (rules: MaterialRules | null) => void
}

// Deja fuera las reglas vacías para no guardar basura en la BD.
function clean(rules: MaterialRules): MaterialRules | null {
  const next: MaterialRules = {}
  const when = Object.fromEntries(Object.entries(rules.when ?? {}).filter(([, values]) => values.length > 0))
  if (Object.keys(when).length > 0) next.when = when
  if (rules.yieldBy) {
    const values = Object.fromEntries(Object.entries(rules.yieldBy.values).filter(([, value]) => Number.isFinite(value)))
    if (Object.keys(values).length > 0) next.yieldBy = { key: rules.yieldBy.key, values }
  }
  if (rules.perSpacing) next.perSpacing = true
  if (rules.perHeight) next.perHeight = true
  return Object.keys(next).length > 0 ? next : null
}

export function summarizeRules(rules: MaterialRules | null | undefined) {
  if (!rules) return ""
  const parts: string[] = []
  if (rules.when) parts.push("solo en algunas variantes")
  if (rules.yieldBy) parts.push("rendimiento por variante")
  if (rules.perSpacing) parts.push("según separación")
  if (rules.perHeight) parts.push("según altura")
  return parts.join(" · ")
}

export function MaterialRulesEditor({ rules, inputs, onChange }: MaterialRulesEditorProps) {
  const current = rules ?? {}
  const selects = inputs.filter((input) => input.type === "select" && input.options?.length)
  const hasSpacing = inputs.some((input) => input.key === "stud_spacing")
  const hasHeight = inputs.some((input) => input.key === "height")

  const update = (patch: Partial<MaterialRules>) => onChange(clean({ ...current, ...patch }))

  const toggleWhen = (key: string, value: string, checked: boolean) => {
    const selected = current.when?.[key] ?? []
    const next = checked ? [...selected, value] : selected.filter((item) => item !== value)
    update({ when: { ...current.when, [key]: next } })
  }

  const yieldKey = current.yieldBy?.key ?? selects[0]?.key
  const yieldInput = selects.find((input) => input.key === yieldKey)

  if (selects.length === 0 && !hasSpacing && !hasHeight) {
    return <p className="text-xs text-muted-foreground">Agrega primero campos de selección (variantes) arriba para poder usar reglas.</p>
  }

  return (
    <div className="space-y-4 text-sm">
      {selects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aparece solo si…</p>
          {selects.map((input) => (
            <div key={input.key} className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-xs font-medium w-44">{input.label}</span>
              {input.options!.map((option) => (
                <label key={option.value} className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={current.when?.[input.key]?.includes(option.value) ?? false}
                    onChange={(event) => toggleWhen(input.key, option.value, event.target.checked)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Sin nada marcado, el material aparece siempre.</p>
        </div>
      )}

      {yieldInput && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rendimiento por m² distinto según…</p>
          <select
            value={current.yieldBy ? yieldKey : ""}
            onChange={(event) => {
              const key = event.target.value
              update({ yieldBy: key ? { key, values: {} } : undefined })
            }}
            className="h-9 rounded-md border bg-background px-2 text-xs"
          >
            <option value="">Mismo rendimiento siempre</option>
            {selects.map((input) => (
              <option key={input.key} value={input.key}>{input.label}</option>
            ))}
          </select>
          {current.yieldBy && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {yieldInput.options!.map((option) => (
                <div key={option.value}>
                  <label className="text-xs text-muted-foreground">{option.label}</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={current.yieldBy?.values[option.value] ?? ""}
                    placeholder="Rendimiento base"
                    onChange={(event) => {
                      const values = { ...current.yieldBy!.values }
                      if (event.target.value === "") delete values[option.value]
                      else values[option.value] = parseFloat(event.target.value)
                      update({ yieldBy: { key: current.yieldBy!.key, values } })
                    }}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(hasSpacing || hasHeight) && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cambia con la medida de la pared</p>
          {hasSpacing && (
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={current.perSpacing ?? false} onChange={(event) => update({ perSpacing: event.target.checked })} />
              Según la separación de studs (el rendimiento base es para 0,61 m)
            </label>
          )}
          {hasHeight && (
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={current.perHeight ?? false} onChange={(event) => update({ perHeight: event.target.checked })} />
              Según la altura de la pared (el rendimiento base es para 2,40 m)
            </label>
          )}
        </div>
      )}
    </div>
  )
}
