"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Material {
  name: string
  unit: string
  yield: string
  unitPrice: string
}

export default function NewCalculatorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState('32')
  const [materials, setMaterials] = useState<Material[]>([
    { name: 'Plancha', unit: 'plancha', yield: '0.35', unitPrice: '' },
    { name: 'Ángulos', unit: 'und', yield: '0.60', unitPrice: '' },
  ])

  const addMaterial = () => {
    setMaterials([...materials, { name: '', unit: '', yield: '', unitPrice: '' }])
  }

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    const updated = [...materials]
    updated[index][field] = value
    setMaterials(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      alert('El nombre es requerido')
      return
    }

    if (materials.length === 0) {
      alert('Debe haber al menos un material')
      return
    }

    if (materials.some(m => !m.name || !m.unit || !m.yield)) {
      alert('Todos los campos de materiales son requeridos')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/calculators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          area: parseFloat(area) || 32,
          materials: materials.map(m => ({
            name: m.name,
            unit: m.unit,
            yield: parseFloat(m.yield),
            unitPrice: m.unitPrice ? parseFloat(m.unitPrice) : null
          }))
        })
      })

      if (!res.ok) throw new Error('Failed to create')

      router.push('/admin/calculators')
      router.refresh()
    } catch (err) {
      alert('Error al crear calculadora')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin/calculators"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Calculadoras
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Nueva Calculadora</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea un nuevo sistema de cálculo de materiales
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4 bg-card border rounded-lg p-6">
          <div>
            <label className="text-sm font-medium">Nombre del Sistema</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Gypsum (Pared/Tumbado)"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del sistema (opcional)"
              className="mt-1 min-h-24"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Área de Cálculo (m²)</label>
            <Input
              type="number"
              step="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="32"
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Materiales</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addMaterial}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Material
            </Button>
          </div>

          <div className="space-y-3">
            {materials.map((material, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-card border rounded-lg items-end"
              >
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Nombre
                  </label>
                  <Input
                    value={material.name}
                    onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                    placeholder="Ej: Plancha"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Unidad
                  </label>
                  <Input
                    value={material.unit}
                    onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                    placeholder="Ej: plancha"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Rendimiento/m²
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    value={material.yield}
                    onChange={(e) => updateMaterial(index, 'yield', e.target.value)}
                    placeholder="0.35"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Precio unitario (opcional)
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={material.unitPrice}
                    onChange={(e) => updateMaterial(index, 'unitPrice', e.target.value)}
                    placeholder="Ej: 8.50 o 0.017"
                    className="mt-1"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => removeMaterial(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Calculadora'}
          </Button>
        </div>
      </form>
    </div>
  )
}
