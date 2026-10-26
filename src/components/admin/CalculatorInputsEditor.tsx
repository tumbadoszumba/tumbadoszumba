"use client"

import { CalculatorInput } from "@/lib/calculator-templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"

interface Props {
  inputs: CalculatorInput[]
  onChange: (inputs: CalculatorInput[]) => void
}

const toKey = (label: string) => label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")

export function CalculatorInputsEditor({ inputs, onChange }: Props) {
  function update(index: number, changes: Partial<CalculatorInput>) {
    onChange(inputs.map((input, current) => current === index ? { ...input, ...changes } : input))
  }

  function addInput() {
    onChange([...inputs, { key: `campo_${inputs.length + 1}`, label: "Nuevo campo", type: "select", options: [] }])
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Campos del cliente</h2>
          <p className="text-sm text-muted-foreground">Define qué datos y opciones verá el cliente para este sistema.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addInput}>
          <Plus className="h-4 w-4 mr-2" /> Agregar campo
        </Button>
      </div>

      {inputs.map((input, index) => (
        <div key={`${input.key}-${index}`} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_150px_1fr_auto] md:items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Etiqueta</label>
            <Input value={input.label} onChange={(event) => update(index, { label: event.target.value, key: toKey(event.target.value) || input.key })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <select value={input.type} onChange={(event) => update(index, { type: event.target.value as CalculatorInput["type"], options: event.target.value === "select" ? input.options ?? [] : undefined })} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="select">Opciones</option>
              <option value="number">Número</option>
            </select>
          </div>
          {input.type === "select" ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Opciones, una por línea</label>
              <Textarea value={(input.options ?? []).map((option) => option.label).join("\n")} onChange={(event) => update(index, { options: event.target.value.split("\n").map((label) => label.trim()).filter(Boolean).map((label) => ({ label, value: toKey(label) })) })} placeholder={"Regular\nHumedad"} className="mt-1 min-h-20" />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Unidad</label>
              <Input value={input.unit ?? ""} onChange={(event) => update(index, { unit: event.target.value })} placeholder="m, m², cm" className="mt-1" />
            </div>
          )}
          <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => onChange(inputs.filter((_, current) => current !== index))} aria-label={`Eliminar ${input.label}`}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </section>
  )
}
