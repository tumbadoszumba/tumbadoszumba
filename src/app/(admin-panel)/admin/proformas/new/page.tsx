"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronLeft, Search, Plus, Trash2, FileText, Download, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPrice } from "@/lib/format"
import { proformaOriginLabel, type ProformaSource } from "@/lib/proforma-origin"
import type { Branch } from "@/types"
import type { ProformaClient } from "@/app/api/admin/proformas/clients/route"
import type { AdminCatalogProduct } from "@/app/api/admin/products/catalog/route"

interface ClientProforma {
  id: string
  requestCode: string | null
  proformaNumber: number | null
  status: string
  source: ProformaSource
  createdBySellerName: string | null
  calculator: { name: string } | null
  createdAt: string
  total: number
  itemCount: number
}

type CatalogProduct = AdminCatalogProduct

// Qué precio del producto se usa al agregarlo: especial (público), contado o
// compra (costo). Si el producto no tiene ese precio, se usa el especial.
type PriceKind = "price" | "cashPrice" | "costPrice"
const PRICE_OPTIONS: { key: PriceKind; label: string }[] = [
  { key: "price", label: "Precio especial" },
  { key: "cashPrice", label: "Precio contado" },
  { key: "costPrice", label: "Precio compra" },
]
const priceOf = (p: CatalogProduct, kind: PriceKind) => p[kind] ?? p.price

const emptyToNull = (v: unknown) => (v === "" || v == null ? null : Number(v))

const formSchema = z.object({
  branchId: z.string().min(1, "Elige el local"),
  sellerId: z.string().min(1, "Elige el vendedor"),
  pin: z.string().regex(/^\d{6}$/, "La clave tiene 6 dígitos"),
  contactName: z.string().trim().min(2, "Escribe el nombre del cliente"),
  contactPhone: z.string().trim().optional(),
  contactDocument: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  // Cliente con cuenta elegido en «Cliente registrado».
  userId: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        name: z.string().trim().min(1, "Escribe el nombre"),
        unit: z.string().trim().min(1, "Falta la unidad"),
        quantity: z.number({ error: "Escribe la cantidad" }).positive("Debe ser mayor a 0"),
        unitPrice: z.number().nonnegative("No puede ser negativo").nullable(),
      })
    )
    .min(1, "Agrega al menos un producto"),
})

type FormValues = z.infer<typeof formSchema>

// Quita tildes para buscar «yeso» y encontrar «Yéso», etc.
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

// Página para que un vendedor arme una proforma desde cero, sin calculadora:
// elige productos del catálogo (o escribe líneas a mano), y se identifica con
// Local + Vendedor + su clave. Al generarla va al detalle de siempre, donde se
// edita y se saca el PDF.
export default function NewProformaPage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Mismas opciones del PDF que en el detalle de la proforma.
  const [blankClient, setBlankClient] = useState(false)
  const [showUnitPrice, setShowUnitPrice] = useState(false)
  const [showItemTotal, setShowItemTotal] = useState(false)
  const [priceKind, setPriceKind] = useState<PriceKind>("price")
  // Cliente nuevo (se escriben los datos) o registrado (se busca y se eligen).
  const [clientMode, setClientMode] = useState<"new" | "registered">("new")
  const [clientQuery, setClientQuery] = useState("")
  const [clientResults, setClientResults] = useState<ProformaClient[]>([])
  const [selectedClient, setSelectedClient] = useState<ProformaClient | null>(null)
  const [clientHistory, setClientHistory] = useState<ClientProforma[] | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchId: "",
      sellerId: "",
      pin: "",
      contactName: "",
      contactPhone: "",
      contactDocument: "",
      contactEmail: "",
      items: [],
    },
  })
  const { fields, append, remove, update } = useFieldArray({ control, name: "items" })
  const branchId = useWatch({ control, name: "branchId" })
  const items = useWatch({ control, name: "items" })

  useEffect(() => {
    fetch("/api/admin/branches")
      .then((res) => (res.ok ? res.json() : []))
      .then(setBranches)
      .catch(() => setBranches([]))

    fetch("/api/admin/products/catalog")
      .then((res) => res.json())
      .then((data) => setCatalog(data.products || []))
      .catch((err) => console.error("Error cargando productos:", err))
      .finally(() => setCatalogLoading(false))
  }, [])

  useEffect(() => {
    const q = clientQuery.trim()
    if (clientMode !== "registered" || selectedClient || q.length < 2) {
      setClientResults([])
      return
    }
    const timer = setTimeout(() => {
      fetch(`/api/admin/proformas/clients?q=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : { clients: [] }))
        .then((data) => setClientResults(data.clients ?? []))
        .catch(() => setClientResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [clientQuery, clientMode, selectedClient])

  // Proformas anteriores del cliente elegido (por su cuenta y/o su teléfono).
  useEffect(() => {
    if (!selectedClient) {
      setClientHistory(null)
      return
    }
    const params = new URLSearchParams({ limit: "20" })
    if (selectedClient.userId) params.set("userId", selectedClient.userId)
    if (selectedClient.phone) params.set("phone", selectedClient.phone)
    fetch(`/api/admin/proformas?${params}`)
      .then((res) => (res.ok ? res.json() : { proformas: [] }))
      .then((data) => setClientHistory(data.proformas ?? []))
      .catch(() => setClientHistory([]))
  }, [selectedClient])

  function selectClient(client: ProformaClient) {
    setSelectedClient(client)
    setClientQuery("")
    setValue("contactName", client.name)
    setValue("contactPhone", client.phone ?? "")
    setValue("contactEmail", client.email ?? "")
    setValue("contactDocument", client.document ?? "")
    setValue("userId", client.userId ?? undefined)
  }

  function changeClientMode(mode: "new" | "registered") {
    setClientMode(mode)
    setSelectedClient(null)
    setClientQuery("")
    setValue("userId", undefined)
    if (mode === "new") {
      setValue("contactName", "")
      setValue("contactPhone", "")
      setValue("contactEmail", "")
      setValue("contactDocument", "")
    }
  }

  const activeBranches = branches.filter((b) => b.active)
  const sellers = branches.find((b) => b.id === branchId)?.sellers.filter((s) => s.active) ?? []

  const results = useMemo(() => {
    const term = normalize(search.trim())
    if (!term) return []
    return catalog
      .filter((p) => normalize(p.name).includes(term) || normalize(p.code ?? "").includes(term))
      .slice(0, 8)
  }, [catalog, search])

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0),
    0
  )

  // Al cambiar el precio a usar, se actualizan las líneas del catálogo (las
  // escritas a mano no cambian).
  function changePriceKind(kind: PriceKind) {
    setPriceKind(kind)
    ;(items ?? []).forEach((item, index) => {
      const product = item.productId ? catalog.find((p) => p.id === item.productId) : null
      if (product) update(index, { ...item, unitPrice: priceOf(product, kind) })
    })
  }

  function addProduct(product: CatalogProduct) {
    const index = (items ?? []).findIndex((item) => item.productId === product.id)
    if (index >= 0) {
      const current = items[index]
      update(index, { ...current, quantity: (Number(current.quantity) || 0) + 1 })
    } else {
      append({ productId: product.id, name: product.name, unit: "und", quantity: 1, unitPrice: priceOf(product, priceKind) })
    }
    setSearch("")
  }

  // "save": solo guarda. "open"/"download": guarda y saca el PDF con la misma
  // clave y las opciones elegidas. En todos los casos termina en el detalle.
  const submitWith = (mode: "save" | "open" | "download") =>
    handleSubmit(async (values) => {
      setSubmitError(null)
      let created: { id: string; requestCode: string }
      try {
        const res = await fetch("/api/admin/proformas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || !body?.id) {
          setSubmitError(body?.error || "No se pudo generar la proforma")
          return
        }
        created = body
      } catch {
        setSubmitError("No se pudo generar la proforma. Revisa tu conexión.")
        return
      }

      if (mode !== "save") {
        try {
          const res = await fetch(`/api/admin/proformas/${created.id}/pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              branchId: values.branchId,
              sellerId: values.sellerId,
              pin: values.pin,
              blank: blankClient,
              download: mode === "download",
              showUnitPrice,
              showItemTotal,
            }),
          })
          if (!res.ok) throw new Error("pdf")
          const url = URL.createObjectURL(await res.blob())
          // Si el navegador bloquea la pestaña nueva, se descarga.
          if (mode === "download" || !window.open(url, "_blank")) {
            const a = document.createElement("a")
            a.href = url
            a.download = `proforma-${created.requestCode}.pdf`
            a.click()
          }
        } catch {
          alert(`La proforma ${created.requestCode} se guardó, pero no se pudo generar el PDF. Sácalo desde el detalle.`)
        }
      }

      router.push(`/admin/proformas/${created.id}`)
    })

  return (
    <form onSubmit={submitWith("open")} autoComplete="off" className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/proformas"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a Proformas
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Generar proforma</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Arma una proforma con productos del catálogo, sin usar la calculadora.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendedor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Local</label>
            <Controller
              control={control}
              name="branchId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setValue("sellerId", "")
                  }}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Elige el local" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.branchId && <p className="mt-1 text-xs text-destructive">{errors.branchId.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Vendedor</label>
            <Controller
              control={control}
              name="sellerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!branchId}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Elige el vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sellerId && <p className="mt-1 text-xs text-destructive">{errors.sellerId.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Clave del vendedor</label>
            {/* new-password: evita que Chrome rellene aquí una contraseña guardada. */}
            <Input
              {...register("pin", { setValueAs: (v) => String(v ?? "").replace(/\D/g, "") })}
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              placeholder="6 dígitos"
              className="mt-1 font-mono"
            />
            {errors.pin && <p className="mt-1 text-xs text-destructive">{errors.pin.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="inline-flex rounded-md border p-1 gap-1">
            {(["new", "registered"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeClientMode(mode)}
                className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                  clientMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "new" ? "Cliente nuevo" : "Cliente registrado"}
              </button>
            ))}
          </div>

          {clientMode === "registered" &&
            (selectedClient ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{selectedClient.name}</span>
                  {selectedClient.phone && <span className="text-muted-foreground"> · {selectedClient.phone}</span>}
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {selectedClient.kind === "account" ? "Con cuenta" : "Sin cuenta"}
                  </Badge>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => changeClientMode("registered")}>
                  Cambiar cliente
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <Input
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  placeholder="Buscar por nombre, teléfono, correo, cédula o código TZ-…"
                  autoComplete="off"
                  className="pl-9"
                />
                {clientQuery.trim().length >= 2 && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md divide-y max-h-80 overflow-y-auto">
                    {clientResults.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No se encontraron clientes</p>
                    ) : (
                      clientResults.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => selectClient(c)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{c.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[c.phone, c.email, c.document].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-xs text-muted-foreground">
                            {c.kind === "account" ? "Con cuenta" : "Sin cuenta"}
                            <br />
                            {c.proformaCount} proforma{c.proformaCount === 1 ? "" : "s"}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input {...register("contactName")} placeholder="Nombre del cliente" autoComplete="off" className="mt-1" />
            {errors.contactName && <p className="mt-1 text-xs text-destructive">{errors.contactName.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Teléfono</label>
            <Input {...register("contactPhone")} type="tel" placeholder="0991234567" autoComplete="off" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Cédula o RUC</label>
            <Input {...register("contactDocument")} placeholder="Opcional" autoComplete="off" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Correo</label>
            <Input {...register("contactEmail")} type="email" placeholder="Opcional" autoComplete="off" className="mt-1" />
            {errors.contactEmail && <p className="mt-1 text-xs text-destructive">{errors.contactEmail.message}</p>}
          </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Precio a usar:</span>
            <div className="inline-flex rounded-md border p-1 gap-1">
              {PRICE_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => changePriceKind(o.key)}
                  className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                    priceKind === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Cambia el precio de los productos del catálogo; si un producto no tiene ese precio, usa el especial.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={catalogLoading ? "Cargando productos..." : "Buscar producto por nombre..."}
                className="pl-9"
                disabled={catalogLoading}
              />
              {search.trim() && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md divide-y max-h-80 overflow-y-auto">
                  {results.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No se encontraron productos</p>
                  ) : (
                    results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{p.name}</span>
                          {p.code && <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{p.code}</span>}
                          {!p.isActive && (
                            <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                              Oculto
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">${formatPrice(priceOf(p, priceKind))}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ productId: undefined, name: "", unit: "und", quantity: 1, unitPrice: null })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Línea a mano
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">
              Busca un producto para agregarlo a la proforma.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_5rem_6rem_7rem_6rem_2.5rem] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Producto</span>
                <span>Unidad</span>
                <span>Cantidad</span>
                <span>Precio unit.</span>
                <span className="text-right">Total</span>
                <span />
              </div>
              {fields.map((field, index) => {
                const item = items?.[index]
                const lineTotal = (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0)
                const itemErrors = errors.items?.[index]
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-2 sm:grid-cols-[1fr_5rem_6rem_7rem_6rem_2.5rem] gap-2 items-start border-b pb-3 sm:border-0 sm:pb-0"
                  >
                    <div className="col-span-2 sm:col-span-1">
                      <Input
                        {...register(`items.${index}.name`)}
                        placeholder="Nombre del producto o servicio"
                        readOnly={!!field.productId}
                        className={field.productId ? "bg-muted/40" : ""}
                      />
                      {itemErrors?.name && <p className="mt-1 text-xs text-destructive">{itemErrors.name.message}</p>}
                    </div>
                    <Input {...register(`items.${index}.unit`)} placeholder="und" aria-label="Unidad" />
                    <div>
                      <Input
                        {...register(`items.${index}.quantity`, { setValueAs: emptyToNull })}
                        type="number"
                        step="any"
                        min="0"
                        aria-label="Cantidad"
                      />
                      {itemErrors?.quantity && (
                        <p className="mt-1 text-xs text-destructive">{itemErrors.quantity.message}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        {...register(`items.${index}.unitPrice`, { setValueAs: emptyToNull })}
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="Sin precio"
                        aria-label="Precio unitario"
                      />
                      {itemErrors?.unitPrice && (
                        <p className="mt-1 text-xs text-destructive">{itemErrors.unitPrice.message}</p>
                      )}
                    </div>
                    <p className="font-mono text-sm sm:text-right self-center">${lineTotal.toFixed(2)}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 justify-self-end"
                      onClick={() => remove(index)}
                      aria-label="Quitar línea"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </div>
                )
              })}
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs text-muted-foreground">Los precios ya incluyen el IVA (15%); el PDF lo desglosa del total.</span>
                <span className="text-sm">
                  Subtotal: <span className="font-mono font-semibold text-base">${subtotal.toFixed(2)}</span>
                </span>
              </div>
            </div>
          )}
          {errors.items?.root && <p className="text-xs text-destructive">{errors.items.root.message}</p>}
          {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opciones del PDF</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
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
        </CardContent>
      </Card>

      {submitError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/proformas")} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="button" variant="outline" onClick={submitWith("save")} disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" strokeWidth={1.75} />
          Guardar sin PDF
        </Button>
        <Button type="button" variant="outline" onClick={submitWith("download")} disabled={isSubmitting}>
          <Download className="h-4 w-4 mr-2" strokeWidth={1.75} />
          Generar y descargar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <FileText className="h-4 w-4 mr-2" strokeWidth={1.75} />
          {isSubmitting ? "Generando..." : "Generar proforma (PDF)"}
        </Button>
      </div>

      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proformas anteriores de {selectedClient.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {clientHistory === null ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : clientHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este cliente no tiene proformas anteriores.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {clientHistory.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/proformas/${p.id}`}
                    target="_blank"
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <span>
                      <span className="font-mono font-semibold">{p.requestCode ?? "—"}</span>
                      {p.proformaNumber != null && (
                        <span className="ml-2 text-muted-foreground">N.º {p.proformaNumber}</span>
                      )}
                      <span className="block text-xs text-muted-foreground">
                        {proformaOriginLabel(p)} · {p.itemCount} productos ·{" "}
                        {new Date(p.createdAt).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </span>
                    <span className="font-mono">${p.total.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  )
}
