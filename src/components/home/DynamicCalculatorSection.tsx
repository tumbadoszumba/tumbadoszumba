"use client"

import { useStoreContact } from "@/components/providers/StoreContactProvider"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator, Product } from "@/types"
import { CalculatorInput } from "@/lib/calculator-templates"
import { calcMaterialQty } from "@/lib/calculator-engine"
import { Calculator as CalculatorIcon, ArrowRight, ChevronDown, Info, Package, X, Trash2, RotateCcw, Plus, Minus, Search, FileText } from "lucide-react"

const LABEL_CLASS = "block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-500"
const FIELD_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

const PLANCHA_TABS = [
  { key: "normal", label: "Normal", displayName: "Plancha de Yeso Estándar (ST)", unitPrice: 10.75 },
  { key: "rh", label: "RH", displayName: "Plancha de Yeso RH (Resist. Humedad)", unitPrice: 15 },
] as const

const APPLICATION_TABS = [
  { key: "pared", label: "Pared" },
  { key: "tumbado", label: "Tumbado" },
] as const

type PlanchaTabKey = (typeof PLANCHA_TABS)[number]["key"]
type ApplicationTabKey = (typeof APPLICATION_TABS)[number]["key"]

const SYSTEM_LABELS: Record<string, string> = {
  "gypsum-pared-tumbado": "Gypsum",
  "cielo-raso-120x60": "Cielo Raso 1.20×60",
  "cielo-raso-60x60": "Cielo Raso 60×60",
}

function getSystemLabel(calc: Calculator): string {
  return SYSTEM_LABELS[calc.slug] ?? calc.name
}

function isGypsumCalc(calc: Calculator | undefined): boolean {
  return calc?.slug === "gypsum-pared-tumbado"
}

interface SegmentedToggleProps<T extends string> {
  label: string
  options: readonly { key: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function SegmentedToggle<T extends string>({ label, options, value, onChange }: SegmentedToggleProps<T>) {
  const activeIndex = options.findIndex((o) => o.key === value)
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <div className="relative flex p-1 rounded-md bg-slate-100 border border-slate-300">
        <motion.div
          className="absolute inset-y-1 rounded bg-white shadow-sm"
          style={{ width: `calc(${100 / options.length}% - 4px)` }}
          animate={{ left: `calc(${(activeIndex * 100) / options.length}% + 4px)` }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className="relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
            style={{ color: value === option.key ? "#1d4ed8" : "#64748b" }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface MaterialItem {
  /** Material de la calculadora. Los productos agregados con el buscador no lo tienen. */
  materialId?: string
  /** Producto de la tienda agregado por el cliente con «Agregar producto». */
  productId?: string
  name: string
  qty: number
  unit: string
  productSlug?: string | null
  unitPriceOverride?: number
}

const rowKey = (item: MaterialItem) => item.materialId ?? item.productId ?? item.name

interface QuantityStepperProps {
  value: number
  unit: string
  label: string
  onChange: (qty: number) => void
}

// Cantidad editable de la lista: − / + de uno en uno, o escribir el número.
function QuantityStepper({ value, unit, label, onChange }: QuantityStepperProps) {
  // Texto mientras el cliente escribe; al salir del campo vuelve a mostrar la cantidad guardada.
  const [draft, setDraft] = useState<string | null>(null)

  function handleType(text: string) {
    setDraft(text)
    const qty = parseFloat(text.replace(",", "."))
    if (qty > 0) onChange(qty)
  }

  const stepClass =
    "w-8 flex items-center justify-center text-blue-800 transition-colors hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"

  return (
    <div className="flex items-stretch h-8 w-[168px] shrink-0 rounded border border-blue-800/30 bg-white overflow-hidden">
      <div className="flex items-stretch flex-1 min-w-0">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= 1}
          className={stepClass}
          aria-label={`Restar 1 a ${label}`}
        >
          <Minus size={13} strokeWidth={2.25} />
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={draft ?? fmt(value)}
          onFocus={(e) => {
            setDraft(fmt(value))
            e.currentTarget.select()
          }}
          onChange={(e) => handleType(e.target.value)}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            // Enter solo confirma la cantidad (no abre la proforma)
            if (e.key === "Enter") {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          aria-label={`Cantidad de ${label}`}
          className="w-0 flex-1 min-w-0 bg-transparent text-center font-bold text-sm lg:text-[13px] text-blue-800 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className={stepClass}
          aria-label={`Sumar 1 a ${label}`}
        >
          <Plus size={13} strokeWidth={2.25} />
        </button>
      </div>
      <span className="flex w-[64px] shrink-0 items-center justify-center truncate border-l border-blue-800/30 bg-blue-50 px-1 text-[11px] font-semibold text-blue-800">
        {unit}
      </span>
    </div>
  )
}

const contactSchema = z.object({
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
})

type ContactForm = z.infer<typeof contactSchema>

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)" }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}

function CalculatorSkeleton() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-white"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-[42px] w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-36" />
            <Skeleton className="h-[42px] w-full" />
          </div>
        </div>

        <Skeleton className="h-[46px] w-full mt-1" />
      </div>
    </div>
  )
}

export function DynamicCalculatorSection() {
  const { whatsapp: WA_NUMBER } = useStoreContact()
  const { data: session } = useSession()
  const [calculators, setCalculators] = useState<Calculator[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCalcId, setSelectedCalcId] = useState<string>("")
  const [planchaType, setPlanchaType] = useState<PlanchaTabKey>("normal")
  const [applicationType, setApplicationType] = useState<ApplicationTabKey>("pared")
  const [area, setArea] = useState("32")
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<MaterialItem[]>([])
  // La lista ya no es la calculada (se quitó, cambió o agregó algo): muestra «Restablecer».
  const [edited, setEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [productResults, setProductResults] = useState<Product[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbort = useRef<AbortController | null>(null)
  // Fila recién agregada: la lista baja hasta ella y la resalta un momento.
  const [highlightKey, setHighlightKey] = useState<string | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

  useEffect(() => {
    if (!highlightKey) return
    rowRefs.current.get(highlightKey)?.scrollIntoView({ behavior: "smooth", block: "center" })
    const timer = setTimeout(() => setHighlightKey(null), 1600)
    return () => clearTimeout(timer)
  }, [highlightKey])

  const contactFormRef = useRef<HTMLFormElement>(null)

  // Enter hace el paso siguiente: calcular → «Cotizar proforma» → «Cotizar precio por WhatsApp».
  // Sin lista de dependencias a propósito: así usa siempre el estado actual.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.isComposing || e.defaultPrevented || loading) return
      const target = e.target as HTMLElement
      // Un botón o enlace con foco ya hace lo suyo con Enter
      if (target.closest("button, a, textarea")) return
      if (!showResults) {
        e.preventDefault()
        handleCalc()
        return
      }
      // En el formulario de contacto, Enter ya lo envía; el buscador maneja su propio Enter
      if (addingProduct || target.closest("form")) return
      e.preventDefault()
      if (!showContactForm) {
        if (results.length > 0) setShowContactForm(true)
      } else {
        contactFormRef.current?.requestSubmit()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contactName: "", contactPhone: "", contactEmail: "" },
  })

  useEffect(() => {
    if (!showResults) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showResults])

  useEffect(() => {
    loadCalculators()
  }, [])

  useEffect(() => {
    const calculator = calculators.find((item) => item.id === selectedCalcId)
    if (!calculator?.inputs?.length) return

    setInputValues(
      Object.fromEntries(
        calculator.inputs
          .filter((input) => input.key !== "area")
          .map((input) => [input.key, input.defaultValue ?? ""])
      )
    )
  }, [calculators, selectedCalcId])

  async function loadCalculators() {
    try {
      const res = await fetch("/api/calculators")
      if (res.ok) {
        const data = await res.json()
        setCalculators(data)
        if (data.length > 0) {
          // Por defecto arranca en Gypsum; el usuario puede cambiar de sistema
          // con el selector.
          const gypsum = data.find((c: Calculator) => c.slug.includes("gypsum"))
          setSelectedCalcId((gypsum ?? data[0]).id)
        }
      }
    } catch (err) {
      console.error("Error loading calculators:", err)
    } finally {
      setLoading(false)
    }
  }

  function resolvePlancha(name: string, calc: Calculator): { name: string; unitPriceOverride?: number } {
    if (!isGypsumCalc(calc) || !/^planchas?$/i.test(name.trim())) {
      return { name }
    }
    const tab = PLANCHA_TABS.find((p) => p.key === planchaType)!
    return { name: tab.displayName, unitPriceOverride: tab.unitPrice }
  }

  // Materiales que aplican a las opciones elegidas, con su cantidad ya calculada.
  function buildItems(calculator: Calculator, areaNum: number): MaterialItem[] {
    return calculator.materials.flatMap((mat) => {
      const qty = calcMaterialQty(mat, areaNum, inputValues)
      if (qty === null) return []
      return [{ materialId: mat.id, ...resolvePlancha(mat.name, calculator), qty, unit: mat.unit, productSlug: mat.productSlug }]
    })
  }

  function handleCalc() {
    if (!selectedCalcId || !area) {
      alert("Por favor selecciona una calculadora e ingresa el área")
      return
    }

    const calculator = calculators.find(c => c.id === selectedCalcId)
    if (!calculator) return

    const missingInput = calculator.inputs?.find(
      (input) => input.required && input.key !== "area" && !inputValues[input.key]
    )
    if (missingInput) {
      alert(`Completa: ${missingInput.label}`)
      return
    }

    const areaNum = parseFloat(area)
    if (areaNum <= 0) {
      alert("El área debe ser mayor a 0")
      return
    }

    setResults(buildItems(calculator, areaNum))
    setEdited(false)
    setShowContactForm(false)
    setShowResults(true)
  }

  function closeResults() {
    setShowResults(false)
    setShowContactForm(false)
    closeProductSearch()
  }

  function handleRemoveItem(index: number) {
    setResults(prev => prev.filter((_, i) => i !== index))
    setEdited(true)
  }

  function handleQtyChange(index: number, qty: number) {
    if (!(qty > 0)) return
    setResults(prev => prev.map((item, i) => (i === index ? { ...item, qty } : item)))
    setEdited(true)
  }

  function handleResetItems() {
    if (!selectedCalcId || !area) return
    const calculator = calculators.find(c => c.id === selectedCalcId)
    if (!calculator) return

    const areaNum = parseFloat(area)
    if (areaNum <= 0) return

    setResults(buildItems(calculator, areaNum))
    setEdited(false)
  }

  function closeProductSearch() {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchAbort.current?.abort()
    setAddingProduct(false)
    setProductQuery("")
    setProductResults([])
    setSearchingProducts(false)
    setSearchFailed(false)
  }

  function handleProductQuery(text: string) {
    setProductQuery(text)
    setSearchFailed(false)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchAbort.current?.abort()

    const q = text.trim()
    if (q.length < 2) {
      setProductResults([])
      setSearchingProducts(false)
      return
    }

    setSearchingProducts(true)
    searchTimer.current = setTimeout(async () => {
      const controller = new AbortController()
      searchAbort.current = controller
      try {
        // Mismo buscador del encabezado: solo devuelve productos visibles en la tienda.
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (controller.signal.aborted) return
        setProductResults(data?.products ?? [])
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("Error searching products:", err)
        setProductResults([])
        setSearchFailed(true)
      }
      setSearchingProducts(false)
    }, 250)
  }

  // Si el producto ya está en la lista (como material o agregado antes), le suma 1.
  function handleAddProduct(product: Product) {
    const existing = results.find(item => item.productSlug === product.slug)
    setHighlightKey(existing ? rowKey(existing) : product.id)
    setResults(prev => {
      const existing = prev.findIndex(item => item.productSlug === product.slug)
      if (existing >= 0) {
        return prev.map((item, i) => (i === existing ? { ...item, qty: item.qty + 1 } : item))
      }
      return [...prev, { productId: product.id, name: product.name, qty: 1, unit: "und", productSlug: product.slug }]
    })
    setEdited(true)
    closeProductSearch()
  }

  const onSubmitProforma = handleSubmit(async (data) => {
    if (results.length === 0) {
      alert("Agrega al menos un material a la lista para enviar la proforma")
      return
    }

    const calculator = calculators.find(c => c.id === selectedCalcId)
    if (!calculator) return

    // Primero se guarda la proforma: el código que va en el WhatsApp solo
    // existe si se guardó bien.
    let requestCode: string
    setSubmitting(true)
    try {
      const res = await fetch("/api/proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculatorId: calculator.id,
          area: parseFloat(area),
          contactName: data.contactName || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
          items: results.map(item => item.productId
            ? { productId: item.productId, quantity: item.qty }
            : {
                materialId: item.materialId,
                quantity: item.qty,
                nameOverride: item.name,
                unitPriceOverride: item.unitPriceOverride,
              }),
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.requestCode) {
        alert(body?.error || "No se pudo enviar la solicitud. Inténtalo de nuevo.")
        return
      }
      requestCode = body.requestCode
    } catch (err) {
      console.error("Error saving proforma:", err)
      alert("No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.")
      return
    } finally {
      setSubmitting(false)
    }

    const itemsList = results
      .map(item => `• ${item.name}: *${fmt(item.qty)} ${item.unit}*`)
      .join("\n")

    const systemDetail = isGypsumCalc(calculator)
      ? ` (${APPLICATION_TABS.find((a) => a.key === applicationType)!.label} · Plancha ${PLANCHA_TABS.find((p) => p.key === planchaType)!.label})`
      : calculator.inputs?.length
        ? ` (${calculator.inputs
          .filter((input) => input.key !== "area")
          .map((input) => `${input.label}: ${formatInputValue(input)}`)
          .filter(Boolean)
          .join(" · ")})`
        : ""

    const phone = data.contactPhone?.trim()
    const msg = encodeURIComponent(
      `🏗️ *Solicitud de Proforma - Tumbados Zumba*\n\n` +
      `🔖 *Código:* ${requestCode}\n` +
      `👤 *Cliente:* ${data.contactName?.trim() || session?.user?.name || "Sin nombre"}\n` +
      (phone ? `📱 *WhatsApp:* ${phone}\n` : "") +
      `📐 *Sistema:* ${calculator.name}${systemDetail}\n` +
      `📏 *Área:* ${fmt(parseFloat(area))} m²\n\n` +
      `📦 *Materiales (${results.length}):*\n${itemsList}\n\n` +
      `Por favor cotizar. ¡Gracias! 🙏`
    )

    // Algunos navegadores (Safari en iPhone) bloquean la pestaña nueva porque se
    // abre después de esperar al guardado; en ese caso se abre en la misma.
    const waUrl = `https://wa.me/${WA_NUMBER}?text=${msg}`
    if (!window.open(waUrl, "_blank")) window.location.href = waUrl
  })

  if (!loading && calculators.length === 0) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white">
        <p>No hay calculadoras disponibles</p>
      </div>
    )
  }

  const selectedCalc = calculators.find(c => c.id === selectedCalcId)

  const formatInputValue = (input: CalculatorInput) => {
    const value = input.key === "area" ? area : inputValues[input.key]
    const option = input.options?.find((item) => item.value === value)
    return option?.label ?? (value ? `${value}${input.unit ? ` ${input.unit}` : ""}` : "")
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <CalculatorSkeleton />
          </motion.div>
        ) : (
      <motion.article
        key="form"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full overflow-hidden rounded-lg bg-white text-slate-900 select-none"
        style={{ boxShadow: "0 24px 48px rgba(15,23,42,0.18)" }}
      >
        <div className="flex flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-center gap-4 pr-10">
            <Image
              src="https://res.cloudinary.com/dxkmtbde/image/upload/v1789012176/basictech/media/general/nfxz6pdjr7z9uiyuihda.png"
              alt=""
              width={48}
              height={48}
              className="flex-shrink-0 w-12 h-12 object-contain"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Tumbados Zumba</p>
              <h3 className="text-lg font-extrabold leading-tight text-slate-900">Calcula tus materiales</h3>
              <p className="text-xs mt-0.5 text-slate-500">Estima los materiales para tu proyecto</p>
            </div>
          </div>

          {/* Campos */}
          <div className="flex flex-col gap-3">
            {calculators.length > 1 && (
              <div>
                <label className={LABEL_CLASS}>Tipo de instalación</label>
                <div className="relative">
                  <select
                    value={selectedCalcId}
                    onChange={(e) => setSelectedCalcId(e.target.value)}
                    className={`${FIELD_CLASS} cursor-pointer appearance-none pr-10`}
                  >
                    {calculators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getSystemLabel(c)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            )}

            {selectedCalc?.inputs?.length ? selectedCalc.inputs.map((input) => (
              <div key={input.key}>
                <label className={LABEL_CLASS}>
                  {input.label}{input.required ? " *" : ""}
                </label>
                {input.type === "select" ? (
                  <div className="relative">
                    <select
                      value={inputValues[input.key] ?? input.defaultValue ?? ""}
                      onChange={(event) => setInputValues((current) => ({ ...current, [input.key]: event.target.value }))}
                      className={`${FIELD_CLASS} cursor-pointer appearance-none pr-10`}
                    >
                      {!input.required && <option value="">Sin seleccionar</option>}
                      {input.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                ) : (
                  <div className="relative flex">
                    <input
                      type="number"
                      value={input.key === "area" ? area : inputValues[input.key] ?? input.defaultValue ?? ""}
                      onChange={(event) => input.key === "area"
                        ? setArea(event.target.value)
                        : setInputValues((current) => ({ ...current, [input.key]: event.target.value }))}
                      placeholder={input.placeholder}
                      step={input.step ?? 0.1}
                      min={input.min}
                      className={`${FIELD_CLASS} ${input.unit ? "rounded-r-none" : ""}`}
                    />
                    {input.unit && (
                      <span className="flex items-center px-3.5 text-sm font-semibold text-slate-500 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md">
                        {input.unit}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )) : isGypsumCalc(selectedCalc) && (
              <>
                <SegmentedToggle
                  label="Tipo de plancha"
                  options={PLANCHA_TABS}
                  value={planchaType}
                  onChange={setPlanchaType}
                />

                <SegmentedToggle
                  label="Aplicación"
                  options={APPLICATION_TABS}
                  value={applicationType}
                  onChange={setApplicationType}
                />
              </>
            )}

            {!selectedCalc?.inputs?.length && <div>
              <label className={LABEL_CLASS}>Área a instalar</label>
              <div className="relative flex">
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej: 15.00"
                  step="0.1"
                  min="0.1"
                  className={`${FIELD_CLASS} rounded-r-none`}
                />
                <span className="flex items-center px-3.5 text-sm font-semibold text-slate-500 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md">
                  m²
                </span>
              </div>
            </div>}

            <div className="flex items-start gap-3 rounded-md bg-blue-50 px-3.5 py-2.5 text-xs leading-snug text-slate-600">
              <Info size={20} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-blue-600" />
              <p>{selectedCalc?.note || "Estimación referencial. Las cantidades pueden variar según el diseño y la instalación."}</p>
            </div>
          </div>

          {/* Botón */}
          <button
            onClick={handleCalc}
            className="w-full flex items-center justify-center gap-2.5 rounded-md bg-[#FF6A00] hover:bg-[#EB5F00] text-white font-bold text-sm py-2.5 transition-all active:scale-[0.98]"
          >
            <CalculatorIcon size={18} strokeWidth={2} />
            Calcular materiales
            <ArrowRight size={18} strokeWidth={2.25} />
          </button>
        </div>
      </motion.article>
        )}
      </AnimatePresence>

      {showResults && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-full max-w-[500px] lg:max-w-[720px] overflow-hidden rounded-md bg-white text-slate-900"
            style={{
              maxHeight: "90vh",
              boxShadow: "0 32px 64px rgba(15,23,42,0.35)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header del modal */}
            <div className="px-5 lg:px-6 py-3 border-b border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Image
                    src="https://res.cloudinary.com/dxkmtbde/image/upload/v1789012176/basictech/media/general/nfxz6pdjr7z9uiyuihda.png"
                    alt=""
                    width={44}
                    height={44}
                    className="flex-shrink-0 w-11 h-11 object-contain"
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Tus materiales</h3>
                    <p className="text-xs text-slate-500 truncate">{selectedCalc?.name}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-800">
                        {fmt(parseFloat(area))} m²
                      </span>
                      {isGypsumCalc(selectedCalc) && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-800">
                          {APPLICATION_TABS.find((a) => a.key === applicationType)!.label} · Plancha {PLANCHA_TABS.find((p) => p.key === planchaType)!.label}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-800">
                        {results.length} {results.length === 1 ? "material" : "materiales"}
                      </span>
                      {edited && results.length > 0 && (
                        <button
                          type="button"
                          onClick={handleResetItems}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF6A00] hover:text-[#EB5F00] transition-colors"
                        >
                          <RotateCcw size={11} strokeWidth={2} />
                          Restablecer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeResults}
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Agregar otro producto: barra fija sobre la lista; los resultados flotan encima de ella */}
            <div className="relative z-20 px-5 lg:px-6 py-2.5 border-b border-slate-200">
              <AnimatePresence initial={false} mode="wait">
                {!addingProduct ? (
                  <motion.button
                    key="add"
                    type="button"
                    onClick={() => setAddingProduct(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    className="w-full flex items-center justify-center gap-1.5 rounded py-2 text-sm font-semibold text-blue-800 border border-dashed border-blue-800/50 bg-white transition-colors hover:bg-blue-50"
                  >
                    <Plus size={14} strokeWidth={2.25} />
                    Agregar producto
                  </motion.button>
                ) : (
                  <motion.div
                    key="search"
                    className="relative"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  >
                    <Search
                      size={14}
                      strokeWidth={2}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      autoFocus
                      value={productQuery}
                      onChange={(e) => handleProductQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") closeProductSearch()
                        // Enter agrega el primer resultado
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (!searchingProducts && productResults[0]) handleAddProduct(productResults[0])
                        }
                      }}
                      placeholder="Buscar producto, ej. gyplac"
                      aria-label="Buscar un producto para agregar"
                      className="w-full pl-9 pr-10 py-2.5 rounded-md bg-white text-sm lg:text-[13px] text-slate-900 placeholder:text-slate-400 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                    <button
                      type="button"
                      onClick={closeProductSearch}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 transition-colors hover:text-slate-900"
                      aria-label="Cerrar el buscador"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {addingProduct && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-5 right-5 lg:left-6 lg:right-6 top-full mt-1 max-h-72 overflow-y-auto py-1 rounded-md bg-white border border-slate-200"
                    style={{
                      boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(15,23,42,0.25) transparent",
                    }}
                  >
                    {searchingProducts ? (
                      <p className="px-3 py-3 text-xs text-slate-500">Buscando…</p>
                    ) : searchFailed ? (
                      <p className="px-3 py-3 text-xs text-red-600">
                        No pudimos buscar en este momento. Escribe de nuevo para reintentar.
                      </p>
                    ) : productQuery.trim().length < 2 ? (
                      <p className="px-3 py-3 text-xs text-slate-500">
                        Escribe al menos 2 letras del producto que necesitas.
                      </p>
                    ) : productResults.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-slate-500">
                        No encontramos productos con «{productQuery.trim()}».
                      </p>
                    ) : (
                      productResults.map((product) => {
                        const inList = results.some((item) => item.productSlug === product.slug)
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAddProduct(product)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                          >
                            <div className="relative w-8 h-8 flex-shrink-0 overflow-hidden rounded bg-white border border-slate-200">
                              {product.images[0] ? (
                                <Image src={product.images[0]} alt="" fill sizes="32px" className="object-contain" />
                              ) : (
                                <Package size={16} strokeWidth={1.5} className="m-auto h-full text-slate-400" />
                              )}
                            </div>
                            <span className="flex-1 min-w-0 text-[13px] text-slate-900 truncate">{product.name}</span>
                            <span className="flex items-center gap-1 shrink-0 text-[11px] font-semibold text-blue-700">
                              <Plus size={12} strokeWidth={2.25} />
                              {inList ? "Sumar 1" : "Agregar"}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Lista de materiales */}
            <div
              className="overflow-y-auto flex-1 px-5 lg:px-6 py-2"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(15,23,42,0.25) transparent" }}
            >
              {results.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-lg bg-slate-100">
                    <Package size={22} strokeWidth={1.5} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">Lista de materiales vacía</p>
                  <button
                    type="button"
                    onClick={handleResetItems}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A00] transition-colors hover:text-[#EB5F00]"
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    Restablecer lista original
                  </button>
                </div>
              ) : (
                <>
                  {/* Encabezado de columnas (solo escritorio) */}
                  <div
                    className="hidden lg:flex items-center gap-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-blue-800"
                  >
                    <span className="flex-1 pl-4">Material</span>
                    <span className="w-[204px]">Cantidad</span>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {results.map((item, idx) => (
                      <div
                        key={rowKey(item)}
                        ref={(el) => {
                          if (el) rowRefs.current.set(rowKey(item), el)
                          else rowRefs.current.delete(rowKey(item))
                        }}
                        className="-mx-2 px-2 flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 py-2.5 lg:py-1.5 transition-colors duration-700"
                        style={{ background: highlightKey === rowKey(item) ? "rgba(255,106,0,0.1)" : "transparent" }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 basis-full sm:basis-auto sm:flex-1">
                          <div className="w-1.5 h-1.5 flex-shrink-0 bg-[#FF6A00]" />
                          {item.productSlug ? (
                            <a
                              href={`/products/${item.productSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver el producto en la tienda"
                              className="text-sm lg:text-[13px] font-semibold text-blue-800 truncate underline-offset-4 hover:underline transition-colors"
                            >
                              {item.name}
                            </a>
                          ) : (
                            <span className="text-sm lg:text-[13px] font-semibold text-blue-800 truncate">{item.name}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 w-full pl-4 sm:w-auto sm:pl-0 lg:w-[204px]">
                          <QuantityStepper
                            value={item.qty}
                            unit={item.unit}
                            label={item.name}
                            onChange={(qty) => handleQtyChange(idx, qty)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 transition-all active:scale-95 hover:bg-red-50 hover:text-red-500"
                            title="Quitar material"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer: «Cotizar proforma» se despliega en el formulario de contacto */}
            <div className="px-5 lg:px-6 py-3 border-t border-slate-200 bg-white">
              <AnimatePresence initial={false} mode="wait">
                {!showContactForm ? (
                  <motion.div
                    key="cta"
                    className="flex items-center justify-between gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  >
                    <p className="hidden sm:block text-xs text-slate-500">Puedes ajustar las cantidades antes de cotizar.</p>
                    <button
                      type="button"
                      onClick={() => setShowContactForm(true)}
                      disabled={results.length === 0}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded bg-[#FF6A00] hover:bg-[#EB5F00] px-6 py-2 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FileText size={15} strokeWidth={2} />
                      Cotizar proforma
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    ref={contactFormRef}
                    onSubmit={onSubmitProforma}
                    // Mismo resorte con el que se abre la calculadora (CategoryMosaic)
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ height: { type: "spring", stiffness: 110, damping: 18 }, opacity: { duration: 0.25, delay: 0.05 } }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="grid gap-3 lg:grid-cols-3">
                        <input
                          type="text"
                          {...register("contactName")}
                          placeholder="Tu nombre (opcional)"
                          className="w-full rounded-md bg-white px-4 py-2.5 text-sm lg:text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
                        />
                        <input
                          type="tel"
                          {...register("contactPhone")}
                          placeholder="Tu número de WhatsApp (opcional)"
                          className="w-full rounded-md bg-white px-4 py-2.5 text-sm lg:text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
                        />
                        <input
                          type="email"
                          {...register("contactEmail")}
                          placeholder="Tu correo (opcional)"
                          aria-invalid={!!errors.contactEmail}
                          className="w-full rounded-md bg-white px-4 py-2.5 text-sm lg:text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
                        />
                      </div>
                      {errors.contactEmail && (
                        <p className="-mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowContactForm(false)}
                          className="rounded-md border border-slate-300 bg-white py-2.5 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={results.length === 0 || submitting}
                          className="flex-1 rounded-md bg-[#25D366] hover:bg-[#1fb957] py-2.5 text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          {submitting ? "Enviando..." : "Cotizar precio por WhatsApp"}
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
