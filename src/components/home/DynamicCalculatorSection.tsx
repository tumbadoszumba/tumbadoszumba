"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator } from "@/types"
import { Calculator as CalculatorIcon, Package, X, Trash2, RotateCcw } from "lucide-react"

const WA_NUMBER = "593990099265"

const ceil = (x: number) => Math.ceil(x - 1e-9)
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

const SYSTEM_TABS = [
  { key: "gypsum", label: "Gypsum" },
  { key: "tumbados", label: "Tumbados" },
] as const

type SystemTabKey = (typeof SYSTEM_TABS)[number]["key"]

interface MaterialItem {
  materialId: string
  name: string
  qty: number
  unit: string
}

const contactSchema = z.object({
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
})

type ContactForm = z.infer<typeof contactSchema>

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white/10 ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)" }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}

function CalculatorSkeleton() {
  return (
    <div
      className="relative w-full overflow-hidden text-white"
      style={{ background: "linear-gradient(145deg, #1a3a8a 0%, #1535cc 40%, #0d1f6e 100%)" }}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        </div>

        <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />

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
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [calculators, setCalculators] = useState<Calculator[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCalcId, setSelectedCalcId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<SystemTabKey>("gypsum")
  const [area, setArea] = useState("32")
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<MaterialItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset: resetContactForm,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contactName: "", contactPhone: "" },
  })

  useEffect(() => {
    loadCalculators()
  }, [])

  useEffect(() => {
    if (session?.user) {
      resetContactForm({
        contactName: session.user.name || "",
        contactPhone: session.user.phone || "",
      })
    }
  }, [session, resetContactForm])

  async function loadCalculators() {
    try {
      const res = await fetch("/api/calculators")
      if (res.ok) {
        const data = await res.json()
        setCalculators(data)
        if (data.length > 0) {
          setSelectedCalcId(data[0].id)
        }
      }
    } catch (err) {
      console.error("Error loading calculators:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleCalc() {
    if (sessionStatus !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/")}`)
      return
    }

    if (!selectedCalcId || !area) {
      alert("Por favor selecciona una calculadora e ingresa el área")
      return
    }

    const calculator = calculators.find(c => c.id === selectedCalcId)
    if (!calculator) return

    const areaNum = parseFloat(area)
    if (areaNum <= 0) {
      alert("El área debe ser mayor a 0")
      return
    }

    const items: MaterialItem[] = calculator.materials.map(mat => ({
      materialId: mat.id,
      name: mat.name,
      qty: ceil(areaNum * mat.yield),
      unit: mat.unit
    }))

    setResults(items)
    setShowResults(true)
  }

  function handleRemoveItem(index: number) {
    setResults(prev => prev.filter((_, i) => i !== index))
  }

  function handleResetItems() {
    if (!selectedCalcId || !area) return
    const calculator = calculators.find(c => c.id === selectedCalcId)
    if (!calculator) return

    const areaNum = parseFloat(area)
    if (areaNum <= 0) return

    const items: MaterialItem[] = calculator.materials.map(mat => ({
      materialId: mat.id,
      name: mat.name,
      qty: ceil(areaNum * mat.yield),
      unit: mat.unit
    }))

    setResults(items)
  }

  const onSubmitProforma = handleSubmit(async (data) => {
    if (results.length === 0) {
      alert("Agrega al menos un material a la lista para enviar la proforma")
      return
    }

    const calculator = calculators.find(c => c.id === selectedCalcId)
    if (!calculator) return

    setSubmitting(true)
    try {
      await fetch("/api/proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculatorId: calculator.id,
          area: parseFloat(area),
          contactName: data.contactName || null,
          contactPhone: data.contactPhone || null,
          items: results.map(item => ({
            materialId: item.materialId,
            quantity: item.qty,
          })),
        }),
      })
    } catch (err) {
      console.error("Error saving proforma:", err)
    } finally {
      setSubmitting(false)
    }

    const itemsList = results
      .map(item => `• ${item.name}: *${fmt(item.qty)} ${item.unit}*`)
      .join("\n")

    const msg = encodeURIComponent(
      `🏗️ *Solicitud de Proforma - TumbadosZumba*\n\n` +
      `👤 *Cliente:* ${data.contactName?.trim() || session?.user?.name || "Sin nombre"}\n` +
      `📐 *Sistema:* ${calculator.name}\n` +
      `📏 *Área:* ${fmt(parseFloat(area))} m²\n\n` +
      `📦 *Materiales (${results.length}):*\n${itemsList}\n\n` +
      `Por favor cotizar. ¡Gracias! 🙏`
    )

    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank")
  })

  if (!loading && calculators.length === 0) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white">
        <p>No hay calculadoras disponibles</p>
      </div>
    )
  }

  const selectedCalc = calculators.find(c => c.id === selectedCalcId)

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
        className="relative w-full overflow-hidden text-white select-none"
        style={{
          background: "linear-gradient(145deg, #1a3a8a 0%, #1535cc 40%, #0d1f6e 100%)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Decoración de fondo */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(100,150,255,0.15)", filter: "blur(40px)" }} />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full pointer-events-none" style={{ background: "rgba(30,80,255,0.12)", filter: "blur(32px)" }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }} />

        <div className="relative z-10 flex flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <CalculatorIcon size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-none text-white tracking-wide">
                Calculadora de Materiales
              </h3>
              <p className="text-[11px] mt-1 font-medium" style={{ color: "rgba(180,200,255,0.8)" }}>
                Cotiza tus materiales al instante
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Campos */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(180,200,255,0.7)" }}>
                Sistema constructivo
              </label>
              <div
                className="relative flex p-1"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <motion.div
                  className="absolute inset-y-1 rounded-sm"
                  style={{ width: "calc(50% - 4px)", background: "#fff" }}
                  animate={{ left: activeTab === "gypsum" ? 4 : "calc(50% + 0px)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
                {SYSTEM_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key)
                      if (calculators.length > 0) setSelectedCalcId(calculators[0].id)
                    }}
                    className="relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{ color: activeTab === tab.key ? "#0d1a35" : "rgba(255,255,255,0.65)" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(180,200,255,0.7)" }}>
                Metros Cuadrados (m²)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej: 15.00"
                  step="0.1"
                  min="0.1"
                  className="w-full px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{ color: "rgba(180,200,255,0.6)" }}
                >
                  m²
                </span>
              </div>
            </div>
          </div>

          {/* Botón */}
          <button
            onClick={handleCalc}
            className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3 transition-all active:scale-95 mt-1"
            style={{
              background: "linear-gradient(135deg, #FF7A1E 0%, #F0531E 100%)",
              boxShadow: "0 4px 16px rgba(240,83,30,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(240,83,30,0.6), inset 0 1px 0 rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(240,83,30,0.45), inset 0 1px 0 rgba(255,255,255,0.15)")}
          >
            <CalculatorIcon size={15} strokeWidth={2} />
            Calcular Materiales
            <span style={{ opacity: 0.8 }}>→</span>
          </button>
        </div>
      </motion.article>
        )}
      </AnimatePresence>

      {showResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,4,15,0.88)", backdropFilter: "blur(8px)" }}>
          <div
            className="w-full overflow-hidden"
            style={{
              maxWidth: 500,
              maxHeight: "90vh",
              background: "linear-gradient(180deg, #0d1a35 0%, #091224 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header del modal */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(240,115,30,0.15)", border: "1px solid rgba(240,115,30,0.3)" }}
                  >
                    <Package size={18} strokeWidth={1.75} style={{ color: "#F0731E" }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white leading-tight">{selectedCalc?.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[11px] font-mono px-2 py-0.5"
                        style={{ background: "rgba(255,255,255,0.07)", color: "rgba(180,200,255,0.8)" }}
                      >
                        {fmt(parseFloat(area))} m²
                      </span>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {results.length} {results.length === 1 ? "material" : "materiales"}
                      </span>
                      {selectedCalc && results.length < selectedCalc.materials.length && (
                        <button
                          type="button"
                          onClick={handleResetItems}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
                          style={{ color: "#F0731E" }}
                        >
                          <RotateCcw size={11} strokeWidth={2} />
                          Restablecer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                  aria-label="Cerrar"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Lista de materiales */}
            <div className="overflow-y-auto flex-1 px-5 py-2">
              {results.length === 0 ? (
                <div className="py-10 text-center">
                  <div
                    className="w-12 h-12 mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <Package size={22} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Lista de materiales vacía</p>
                  <button
                    type="button"
                    onClick={handleResetItems}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: "#F0731E" }}
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    Restablecer lista original
                  </button>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {results.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-1.5 h-1.5 flex-shrink-0" style={{ background: "#F0731E", opacity: 0.7 }} />
                        <span className="text-sm text-white truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="font-mono font-bold text-sm px-2.5 py-1"
                          style={{ background: "rgba(240,115,30,0.12)", color: "#F0931E", border: "1px solid rgba(240,115,30,0.2)" }}
                        >
                          {fmt(item.qty)} {item.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="w-7 h-7 flex items-center justify-center transition-all active:scale-95"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.12)"
                            e.currentTarget.style.color = "#ef4444"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent"
                            e.currentTarget.style.color = "rgba(255,255,255,0.3)"
                          }}
                          title="Quitar material"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con inputs y acciones */}
            <form onSubmit={onSubmitProforma} className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <input
                type="text"
                {...register("contactName")}
                placeholder="Tu nombre (opcional)"
                className="w-full px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(240,115,30,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <input
                type="tel"
                {...register("contactPhone")}
                placeholder="Tu número de WhatsApp (opcional)"
                className="w-full px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(240,115,30,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResults(false)}
                  className="py-2.5 px-4 text-sm font-medium transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={results.length === 0 || submitting}
                  className="flex-1 py-2.5 text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #25D366 0%, #1aad54 100%)",
                    boxShadow: results.length > 0 ? "0 4px 16px rgba(37,211,102,0.35)" : "none",
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {submitting ? "Enviando..." : "Enviar por WhatsApp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
