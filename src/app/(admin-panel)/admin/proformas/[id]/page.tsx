"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, MessageCircle, Trash2, FileText, Download, Eye, RotateCcw, Percent, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ProductPickerDialog } from "@/components/admin/ProductPickerDialog"
import type { Proforma, ProformaStatus, ProformaAdjustmentType, ProformaAdjustmentDirection, Branch } from "@/types"

const statusLabels: Record<ProformaStatus, string> = {
  PENDIENTE: "Pendiente",
  COTIZADA: "Cotizada",
  ENVIADA: "Enviada",
}

// Toda la interfaz (y la factura/PDF) muestra los precios con 2 decimales
// nada más. Al crear o editar un precio sí se permite escribir hasta 3
// decimales (para materiales de centavos), pero la vista siempre redondea a 2.
function fmtPrice(n: number) {
  return `$ ${n.toFixed(2)}`
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

interface AdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  basePrice: number
  initialType?: ProformaAdjustmentType | null
  initialDirection?: ProformaAdjustmentDirection | null
  initialValue?: number | null
  onApply: (type: ProformaAdjustmentType, direction: ProformaAdjustmentDirection, value: number) => void
  onClear?: () => void
  hasAdjustment?: boolean
}

function AdjustDialog({
  open,
  onOpenChange,
  title,
  basePrice,
  initialType,
  initialDirection,
  initialValue,
  onApply,
  onClear,
  hasAdjustment,
}: AdjustDialogProps) {
  const [type, setType] = useState<ProformaAdjustmentType>(initialType ?? "percentage")
  const [direction, setDirection] = useState<ProformaAdjustmentDirection>(initialDirection ?? "decrease")
  const [value, setValue] = useState(initialValue != null ? String(initialValue) : "")

  useEffect(() => {
    if (open) {
      setType(initialType ?? "percentage")
      setDirection(initialDirection ?? "decrease")
      setValue(initialValue != null ? String(initialValue) : "")
    }
  }, [open, initialType, initialDirection, initialValue])

  const numValue = parseFloat(value) || 0
  const magnitude = type === "percentage" ? basePrice * (numValue / 100) : numValue
  const preview = direction === "decrease" ? basePrice - magnitude : basePrice + magnitude

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={direction} onValueChange={(v) => setDirection(v as ProformaAdjustmentDirection)} className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="decrease" /> Disminuir
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="increase" /> Aumentar
            </label>
          </RadioGroup>

          <RadioGroup value={type} onValueChange={(v) => setType(v as ProformaAdjustmentType)} className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="percentage" /> Porcentaje (%)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="fixed" /> Precio fijo ($)
            </label>
          </RadioGroup>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {type === "percentage" ? "Porcentaje" : "Monto"}
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percentage" ? "Ej: 10" : "Ej: 5.00"}
              className="mt-1"
              autoFocus
            />
          </div>

          {numValue > 0 && (
            <p className="text-xs text-muted-foreground">
              Base: {fmtPrice(basePrice)} → Resultado: <span className="font-semibold text-foreground">{fmtPrice(Math.max(0, preview))}</span>
            </p>
          )}
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {hasAdjustment && onClear ? (
            <Button variant="ghost" size="sm" onClick={() => { onClear(); onOpenChange(false) }}>
              Quitar ajuste
            </Button>
          ) : <span />}
          <Button
            size="sm"
            disabled={numValue <= 0}
            onClick={() => {
              onApply(type, direction, numValue)
              onOpenChange(false)
            }}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminProformaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [proforma, setProforma] = useState<Proforma | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactDocument, setContactDocument] = useState("")
  const [blankClient, setBlankClient] = useState(false)
  const [showUnitPrice, setShowUnitPrice] = useState(false)
  const [showItemTotal, setShowItemTotal] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [selectedSellerId, setSelectedSellerId] = useState("")
  const [pin, setPin] = useState("")
  const [generating, setGenerating] = useState(false)
  const [revealedItems, setRevealedItems] = useState<Set<string>>(new Set())
  const [revealTotal, setRevealTotal] = useState(false)
  const [itemAdjustOpen, setItemAdjustOpen] = useState<string | null>(null)
  const [totalAdjustOpen, setTotalAdjustOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    loadProforma()
    loadBranches()
  }, [id])

  async function loadBranches() {
    try {
      const res = await fetch("/api/admin/branches")
      if (res.ok) setBranches(await res.json())
    } catch {
      // El selector de local/vendedor simplemente queda vacío.
    }
  }

  const activeBranches = branches.filter((b) => b.active)
  const sellersOfSelectedBranch = branches.find((b) => b.id === selectedBranchId)?.sellers.filter((s) => s.active) ?? []

  async function generatePdf(download: boolean) {
    if (!selectedBranchId || !selectedSellerId) {
      alert("Selecciona el local y el vendedor")
      return
    }
    if (!/^\d{6}$/.test(pin)) {
      alert("La clave debe tener 6 dígitos")
      return
    }
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/proformas/${id}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranchId,
          sellerId: selectedSellerId,
          pin,
          blank: blankClient,
          download,
          showUnitPrice,
          showItemTotal,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        alert(data?.error || "No se pudo generar el PDF")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (download) {
        const a = document.createElement("a")
        a.href = url
        a.download = `proforma-${proforma?.proformaNumber ?? id.slice(-8)}.pdf`
        a.click()
      } else {
        window.open(url, "_blank")
      }
      setPin("")
      await loadProforma()
    } finally {
      setGenerating(false)
    }
  }

  async function loadProforma() {
    try {
      const res = await fetch(`/api/admin/proformas/${id}`)
      if (!res.ok) throw new Error("Not found")
      const data: Proforma = await res.json()
      setProforma(data)
      setContactName(data.contactName || "")
      setContactPhone(data.contactPhone || "")
      setContactEmail(data.contactEmail || "")
      setContactDocument(data.contactDocument || "")
    } catch (err) {
      alert("Error al cargar la proforma")
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function patchProforma(patch: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/proformas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error("Failed")
      await loadProforma()
    } catch (err) {
      alert("Error al actualizar la proforma")
    } finally {
      setSaving(false)
    }
  }

  async function patchItem(itemId: string, patch: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/proformas/${id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error("Failed")
      await loadProforma()
    } catch (err) {
      alert("Error al actualizar el material")
    }
  }

  async function updateItemPrice(itemId: string, unitPrice: number | null) {
    await patchItem(itemId, { unitPrice })
  }

  async function updateItemQuantity(itemId: string, quantity: number) {
    if (!(quantity > 0)) return
    await patchItem(itemId, { quantity })
  }

  async function resetItem(item: Proforma["items"][number]) {
    await patchItem(item.id, {
      unitPrice: item.originalUnitPrice ?? null,
      quantity: item.originalQuantity ?? item.quantity,
    })
  }

  async function removeItem(itemId: string) {
    if (!confirm("¿Quitar este material de la proforma?")) return
    try {
      const res = await fetch(`/api/admin/proformas/${id}/items/${itemId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed")
      await loadProforma()
    } catch (err) {
      alert("Error al quitar el material")
    }
  }

  async function addProductAsItem(product: { id: string; name: string; price: number }) {
    try {
      const res = await fetch(`/api/admin/proformas/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: product.name, unit: "und", quantity: 1, unitPrice: product.price }),
      })
      if (!res.ok) throw new Error("Failed")
      await loadProforma()
    } catch (err) {
      alert("Error al agregar el producto")
    }
  }

  async function addBlankItem() {
    try {
      const res = await fetch(`/api/admin/proformas/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nuevo material", unit: "und", quantity: 1, unitPrice: null }),
      })
      if (!res.ok) throw new Error("Failed")
      await loadProforma()
    } catch (err) {
      alert("Error al agregar el material")
    }
  }

  async function resetAll() {
    if (!confirm("Esto restablece el precio de todos los materiales y quita cualquier descuento/recargo del total. ¿Continuar?")) return
    try {
      const res = await fetch(`/api/admin/proformas/${id}/reset-all`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      await loadProforma()
    } catch (err) {
      alert("Error al restablecer la proforma")
    }
  }

  async function trashProforma() {
    if (!confirm("¿Mover esta proforma a la papelera? Se eliminará automáticamente en 30 días.")) return
    try {
      const res = await fetch(`/api/admin/proformas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      router.push("/admin/proformas")
    } catch (err) {
      alert("Error al mover la proforma a la papelera")
    }
  }

  function toggleReveal(itemId: string) {
    setRevealedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function handleSendWhatsApp() {
    if (!proforma || !contactPhone) return

    const itemsList = proforma.items
      .map((item) => `• ${item.name}: ${item.quantity} ${item.unit}${item.unitPrice ? ` — $${item.total?.toFixed(2)}` : ""}`)
      .join("\n")

    const msg = encodeURIComponent(
      `🏗️ *Proforma - TumbadosZumba*\n\n` +
      `👤 *Cliente:* ${contactName || proforma.user?.name || ""}\n` +
      `📐 *Sistema:* ${proforma.calculator.name}\n` +
      `📏 *Área:* ${proforma.area} m²\n\n` +
      `📦 *Materiales:*\n${itemsList}\n\n` +
      `💰 *Total estimado: $${(proforma.total ?? 0).toFixed(2)}*\n\n` +
      `Quedamos atentos. ¡Gracias! 🙏`
    )

    const phoneDigits = contactPhone.replace(/\D/g, "")
    window.open(`https://wa.me/${phoneDigits}?text=${msg}`, "_blank")
    patchProforma({ status: "ENVIADA" })
  }

  if (loading || !proforma) {
    return <div className="p-6 text-center text-muted-foreground">Cargando...</div>
  }

  const itemsTotal = proforma.itemsTotal ?? proforma.total ?? 0
  const originalTotal = proforma.originalTotal ?? itemsTotal
  const finalTotal = proforma.total ?? itemsTotal
  const hasTotalAdjustment = !!proforma.adjustmentType
  const selectedItem = proforma.items.find((i) => i.id === itemAdjustOpen)

  const itemsWithFlags = proforma.items.map((item) => {
    const priceAdjusted =
      item.originalUnitPrice != null &&
      item.unitPrice != null &&
      Math.abs(item.unitPrice - item.originalUnitPrice) > 0.0001
    const qtyAdjusted =
      item.originalQuantity != null && Math.abs(item.quantity - item.originalQuantity) > 0.0001
    return {
      item,
      isRevealed: revealedItems.has(item.id),
      priceAdjusted,
      qtyAdjusted,
      isAdjusted: priceAdjusted || qtyAdjusted,
    }
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/proformas"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Proformas
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{proforma.calculator.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {proforma.user?.name} · {proforma.user?.email} · {proforma.area} m²
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={proforma.status}
            onValueChange={(value) => patchProforma({ status: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={trashProforma}
            aria-label="Mover a la papelera"
            title="Mover a la papelera"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Materiales</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              El precio se puede ajustar solo para esta proforma; no afecta el precio del material en la calculadora.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="shrink-0">
            Agregar Producto
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop / tablet: tabla completa */}
          <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead className="text-right">P. Unitario</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsWithFlags.map(({ item, isRevealed, isAdjusted, qtyAdjusted }) => {
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{item.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1.5">
                        <Input
                          key={`qty-${item.id}-${item.quantity}`}
                          type="number"
                          step="1"
                          min="0.01"
                          defaultValue={item.quantity}
                          className="w-20 h-8 text-sm"
                          onBlur={(e) => {
                            const parsed = parseFloat(e.target.value)
                            if (!Number.isNaN(parsed) && parsed !== item.quantity) {
                              updateItemQuantity(item.id, parsed)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur()
                          }}
                        />
                        <span>{item.unit}</span>
                      </div>
                      {qtyAdjusted && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Original: {item.originalQuantity}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        key={`price-${item.id}-${item.unitPrice ?? "null"}`}
                        type="number"
                        step="0.001"
                        defaultValue={item.unitPrice != null ? round2(item.unitPrice) : ""}
                        placeholder="—"
                        className="w-24 ml-auto text-right font-mono text-sm h-8"
                        onBlur={(e) => {
                          if (e.target.value !== String(item.unitPrice ?? "")) {
                            const parsed = e.target.value.trim() === "" ? null : parseFloat(e.target.value)
                            updateItemPrice(item.id, parsed !== null && Number.isNaN(parsed) ? null : parsed)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur()
                          }
                        }}
                      />
                      {isRevealed && item.originalUnitPrice != null && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Real: {fmtPrice(item.originalUnitPrice)}
                        </p>
                      )}
                      {isAdjusted && !isRevealed && (
                        <p className="text-[11px] text-brand-orange mt-1">Ajustado</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {item.total != null ? fmtPrice(item.total) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleReveal(item.id)}
                          aria-label="Ver precio real"
                          title="Ver precio real"
                          disabled={item.originalUnitPrice == null}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setItemAdjustOpen(item.id)}
                          aria-label="Ajustar precio"
                          title="Ajustar precio (% o fijo)"
                          disabled={item.originalUnitPrice == null}
                        >
                          <Percent className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => resetItem(item)}
                          aria-label="Restablecer material"
                          title="Restablecer precio y cantidad originales"
                          disabled={!isAdjusted}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Quitar ${item.name}`}
                          title="Eliminar material"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold text-sm">
                  Total
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-sm">
                  {fmtPrice(finalTotal)}
                  {revealTotal && Math.abs(originalTotal - finalTotal) > 0.0001 && (
                    <p className="text-[11px] font-normal text-muted-foreground mt-1">
                      Real: {fmtPrice(originalTotal)}
                    </p>
                  )}
                  {hasTotalAdjustment && (
                    <p className="text-[11px] font-normal text-brand-orange mt-1">
                      {proforma.adjustmentDirection === "decrease" ? "Descuento" : "Recargo"}{" "}
                      {proforma.adjustmentType === "percentage" ? `${proforma.adjustmentValue}%` : fmtPrice(proforma.adjustmentValue ?? 0)}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setRevealTotal((v) => !v)}
                      aria-label="Ver total real"
                      title="Ver total real (sin ajustes)"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setTotalAdjustOpen(true)}
                      aria-label="Ajustar total"
                      title="Aplicar descuento o recargo al total"
                    >
                      <Percent className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={resetAll}
                      aria-label="Restablecer todo"
                      title="Restablecer todos los precios y quitar el ajuste del total"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>

          {/* Móvil: tarjetas apiladas, sin scroll horizontal */}
          <div className="sm:hidden divide-y">
            {itemsWithFlags.map(({ item, isRevealed, isAdjusted, qtyAdjusted }) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-sm font-mono font-bold shrink-0">
                    {item.total != null ? fmtPrice(item.total) : "—"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Cantidad</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input
                        key={`m-qty-${item.id}-${item.quantity}`}
                        type="number"
                        step="1"
                        min="0.01"
                        defaultValue={item.quantity}
                        className="w-full h-9 text-sm"
                        onBlur={(e) => {
                          const parsed = parseFloat(e.target.value)
                          if (!Number.isNaN(parsed) && parsed !== item.quantity) {
                            updateItemQuantity(item.id, parsed)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur()
                        }}
                      />
                      <span className="text-xs text-muted-foreground shrink-0">{item.unit}</span>
                    </div>
                    {qtyAdjusted && (
                      <p className="text-[11px] text-muted-foreground mt-1">Original: {item.originalQuantity}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">P. Unitario</label>
                    <Input
                      key={`m-price-${item.id}-${item.unitPrice ?? "null"}`}
                      type="number"
                      step="0.001"
                      defaultValue={item.unitPrice != null ? round2(item.unitPrice) : ""}
                      placeholder="—"
                      className="w-full h-9 text-sm mt-1"
                      onBlur={(e) => {
                        if (e.target.value !== String(item.unitPrice ?? "")) {
                          const parsed = e.target.value.trim() === "" ? null : parseFloat(e.target.value)
                          updateItemPrice(item.id, parsed !== null && Number.isNaN(parsed) ? null : parsed)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur()
                      }}
                    />
                    {isRevealed && item.originalUnitPrice != null && (
                      <p className="text-[11px] text-muted-foreground mt-1">Real: {fmtPrice(item.originalUnitPrice)}</p>
                    )}
                    {isAdjusted && !isRevealed && (
                      <p className="text-[11px] text-brand-orange mt-1">Ajustado</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => toggleReveal(item.id)}
                    aria-label="Ver precio real"
                    disabled={item.originalUnitPrice == null}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setItemAdjustOpen(item.id)}
                    aria-label="Ajustar precio"
                    disabled={item.originalUnitPrice == null}
                  >
                    <Percent className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => resetItem(item)}
                    aria-label="Restablecer material"
                    disabled={!isAdjusted}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Quitar ${item.name}`}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total (móvil) */}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-sm font-semibold">Total</span>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm">{fmtPrice(finalTotal)}</p>
                  {revealTotal && Math.abs(originalTotal - finalTotal) > 0.0001 && (
                    <p className="text-[11px] font-normal text-muted-foreground mt-1">
                      Real: {fmtPrice(originalTotal)}
                    </p>
                  )}
                  {hasTotalAdjustment && (
                    <p className="text-[11px] font-normal text-brand-orange mt-1">
                      {proforma.adjustmentDirection === "decrease" ? "Descuento" : "Recargo"}{" "}
                      {proforma.adjustmentType === "percentage" ? `${proforma.adjustmentValue}%` : fmtPrice(proforma.adjustmentValue ?? 0)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setRevealTotal((v) => !v)} aria-label="Ver total real">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setTotalAdjustOpen(true)} aria-label="Ajustar total">
                  <Percent className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={resetAll} aria-label="Restablecer todo">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdjustDialog
        open={totalAdjustOpen}
        onOpenChange={setTotalAdjustOpen}
        title="Ajustar el total de la proforma"
        basePrice={itemsTotal}
        initialType={proforma.adjustmentType}
        initialDirection={proforma.adjustmentDirection}
        initialValue={proforma.adjustmentValue}
        hasAdjustment={hasTotalAdjustment}
        onApply={(type, direction, value) => {
          patchProforma({ adjustmentType: type, adjustmentDirection: direction, adjustmentValue: value })
        }}
        onClear={() => {
          patchProforma({ adjustmentType: null, adjustmentDirection: null, adjustmentValue: null })
        }}
      />

      {selectedItem && selectedItem.originalUnitPrice != null && (
        <AdjustDialog
          open={itemAdjustOpen === selectedItem.id}
          onOpenChange={(open) => setItemAdjustOpen(open ? selectedItem.id : null)}
          title={`Ajustar precio — ${selectedItem.name}`}
          basePrice={selectedItem.originalUnitPrice}
          onApply={(type, direction, value) => {
            const base = selectedItem.originalUnitPrice as number
            const magnitude = type === "percentage" ? base * (value / 100) : value
            const newPrice = Math.max(0, direction === "decrease" ? base - magnitude : base + magnitude)
            updateItemPrice(selectedItem.id, newPrice)
          }}
        />
      )}

      <ProductPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={addProductAsItem}
        onAddBlank={addBlankItem}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nombre del cliente"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Teléfono{" "}
                {!proforma.contactPhone && (
                  <Badge variant="outline" className="ml-1 text-muted-foreground align-middle">
                    Número no ingresado
                  </Badge>
                )}
              </label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Ej: 593999999999"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Correo{" "}
                {!proforma.contactEmail && (
                  <Badge variant="outline" className="ml-1 text-muted-foreground align-middle">
                    Correo no ingresado
                  </Badge>
                )}
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Ej: cliente@correo.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">RUC / Cédula</label>
              <Input
                value={contactDocument}
                onChange={(e) => setContactDocument(e.target.value)}
                placeholder="Ej: 0102030405"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => patchProforma({ contactName, contactPhone, contactEmail, contactDocument })}
            >
              Guardar contacto
            </Button>
            <Button
              className="bg-[#25D366] hover:bg-[#1aad54]"
              disabled={!contactPhone}
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar proforma por WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generar Proforma (PDF)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {proforma.proformaNumber != null && (
            <p className="text-sm text-muted-foreground">
              N.º {proforma.proformaNumber} · Generada por {proforma.sellerName} en {proforma.branchName}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Local</label>
              <Select
                value={selectedBranchId}
                onValueChange={(v) => {
                  setSelectedBranchId(v)
                  setSelectedSellerId("")
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un local" />
                </SelectTrigger>
                <SelectContent>
                  {activeBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Vendedor</label>
              <Select value={selectedSellerId} onValueChange={setSelectedSellerId} disabled={!selectedBranchId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {sellersOfSelectedBranch.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Clave del vendedor</label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 dígitos"
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={blankClient} onCheckedChange={(v) => setBlankClient(v === true)} />
              Dejar datos del cliente en blanco (llenar a mano)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={showUnitPrice} onCheckedChange={(v) => setShowUnitPrice(v === true)} />
              Mostrar V. Unitario
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={showItemTotal} onCheckedChange={(v) => setShowItemTotal(v === true)} />
              Mostrar Total por material
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled={generating} onClick={() => generatePdf(false)}>
              <FileText className="h-4 w-4 mr-2" />
              Generar Proforma (PDF)
            </Button>
            <Button variant="outline" disabled={generating} onClick={() => generatePdf(true)}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
