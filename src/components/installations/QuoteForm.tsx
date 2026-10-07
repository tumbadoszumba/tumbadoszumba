"use client"

import { SITE } from "@/lib/site"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { quoteProjectTypes, type QuoteProjectType } from "@/data/installation-projects"
import { useInstallationQuoteStore } from "@/stores/installation-quote-store"
import { cn } from "@/lib/utils"
import { SectionTag, btnGhost, btnPrimary, fieldLine, line, mutedText, surface } from "./shared"

const WHATSAPP_NUMBER = SITE.whatsapp
// /api/messages exige email; el formulario solo pide WhatsApp
const FALLBACK_EMAIL = "cotizaciones@tumbadoszumba.com"

const projectTypeValues = quoteProjectTypes.map((t) => t.value) as [QuoteProjectType, ...QuoteProjectType[]]

const quoteSchema = z.object({
  tipoProyecto: z.enum(projectTypeValues, { error: "Elige el tipo de trabajo" }),
  area: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+([.,]\d+)?$/.test(v), "Escribe solo el número, por ejemplo 32"),
  incluirMaterial: z.enum(["si", "no"]),
  name: z.string().trim().min(2, "Escribe tu nombre"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{7,16}$/, "Escribe un número válido"),
  detalles: z.string().trim().max(1000, "Máximo 1000 caracteres"),
})

type QuoteFormData = z.infer<typeof quoteSchema>

const contactInfo = [
  { label: "Dirección", value: SITE.address.street },
  { label: "WhatsApp", value: SITE.phoneDisplay },
  { label: "Horario", value: SITE.hoursText.short },
  { label: "Correo", value: SITE.email },
]

const inputClass = cn(
  "h-11 rounded-none bg-white shadow-none focus-visible:border-brand-orange focus-visible:ring-brand-orange/25 dark:bg-[#0B111C] dark:focus-visible:border-brand-orange",
  fieldLine
)

// Radios con aspecto de botón: el <input> queda oculto y el <span> hermano se pinta con peer-checked
const chipClass = cn(
  "block cursor-pointer border px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-400 dark:text-slate-300",
  "peer-checked:border-brand-orange peer-checked:bg-brand-orange/10 peer-checked:text-brand-orange",
  "dark:peer-checked:border-brand-orange dark:peer-checked:text-brand-orange",
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-orange",
  fieldLine
)

function FieldLabel({ n, htmlFor, children }: { n: string; htmlFor?: string; children: React.ReactNode }) {
  const className = "mb-2 block font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate-500"
  const content = (
    <>
      <span className="mr-1.5 text-brand-orange">{n}</span>
      {children}
    </>
  )
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {content}
    </label>
  ) : (
    <legend className={className}>{content}</legend>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{message}</p>
}

export function QuoteForm() {
  const reference = useInstallationQuoteStore((s) => s.reference)
  const clearReference = useInstallationQuoteStore((s) => s.clearReference)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { area: "", incluirMaterial: "si", name: "", phone: "", detalles: "" },
  })

  // "Quiero uno así" en el portafolio preselecciona el tipo de trabajo
  useEffect(() => {
    if (reference) {
      setSubmitted(false)
      setValue("tipoProyecto", reference.type, { shouldValidate: true })
    }
  }, [reference, setValue])

  function buildDetails(data: QuoteFormData) {
    const type = quoteProjectTypes.find((t) => t.value === data.tipoProyecto)
    return [
      `Tipo de trabajo: ${type?.subject ?? data.tipoProyecto}`,
      `Área aproximada: ${data.area ? `${data.area} m²` : "No especificada"}`,
      `Material: ${data.incluirMaterial === "si" ? "Cotizar también el material" : "El cliente ya tiene el material"}`,
      reference ? `Referencia: obra "${reference.title}"` : null,
      `Detalles:\n${data.detalles || "No especificado"}`,
    ]
      .filter(Boolean)
      .join("\n")
  }

  async function onSubmit(data: QuoteFormData) {
    setServerError(null)
    const type = quoteProjectTypes.find((t) => t.value === data.tipoProyecto)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: FALLBACK_EMAIL,
          phone: data.phone,
          subject: `Cotización de obra: ${type?.subject ?? data.tipoProyecto}`,
          message: buildDetails(data),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || "No se pudo enviar la solicitud")
      }

      setSubmitted(true)
      reset()
      clearReference()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo enviar la solicitud. Intenta de nuevo.")
    }
  }

  // Se valida de forma síncrona para que window.open siga dentro del clic y no lo bloquee el navegador
  function handleWhatsApp() {
    const parsed = quoteSchema.safeParse(getValues())
    if (!parsed.success) {
      void trigger()
      return
    }

    const text = [
      "*Solicitud de cotización - Tumbados Zumba*",
      "",
      `*Nombre:* ${parsed.data.name}`,
      `*Teléfono:* ${parsed.data.phone}`,
      "",
      buildDetails(parsed.data),
      "",
      "_Enviado desde tumbadoszumba.com/instalaciones_",
    ].join("\n")

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
  }

  return (
    <section id="cotizar" className="scroll-mt-24">
      <div className="container mx-auto grid gap-10 px-4 py-14 sm:py-16 lg:grid-cols-[5fr_7fr] lg:gap-12">
        <div>
          <SectionTag>Cotización de obra</SectionTag>
          <h2 className="mt-3.5 text-3xl font-bold leading-[1.03] tracking-[-0.03em] text-slate-900 sm:text-[2.5rem] dark:text-white">
            Cuéntanos tu obra. Te respondemos con presupuesto.
          </h2>
          <p className={cn("mt-3.5 max-w-sm text-[15px] leading-relaxed", mutedText)}>
            Mano de obra y materiales detallados. Si prefieres, escríbenos directo por WhatsApp.
          </p>
          <dl className={cn("mt-7 border-t", line)}>
            {contactInfo.map((item) => (
              <div key={item.label} className={cn("grid grid-cols-[110px_1fr] border-b py-3 text-sm", line)}>
                <dt className="pt-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate-500">{item.label}</dt>
                <dd className="break-all text-slate-900 dark:text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={cn("border", line, surface)}>
          <div
            className={cn(
              "flex justify-between border-b px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500",
              line
            )}
          >
            <span>
              <span aria-hidden className="mr-2 text-brand-orange">■</span>
              Orden de cotización
            </span>
            <span>6 campos · 1 min</span>
          </div>

          {submitted ? (
            <div className="px-5 py-14 text-center">
              <CheckCircle2 className="mx-auto size-10 text-brand-orange" strokeWidth={1.5} />
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Solicitud enviada</h3>
              <p className={cn("mx-auto mt-2 max-w-sm text-sm", mutedText)}>
                Registramos tu obra. Te contactaremos por WhatsApp con tu presupuesto.
              </p>
              <button type="button" onClick={() => setSubmitted(false)} className={cn(btnGhost, "mt-6")}>
                Enviar otra cotización
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 p-5 sm:p-6">
              {reference && (
                <div className="flex items-center justify-between gap-3 border border-brand-orange/40 bg-brand-orange/10 px-3 py-2 text-sm">
                  <span className="text-slate-800 dark:text-slate-200">
                    <span className="mr-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-orange">
                      Referencia
                    </span>
                    {reference.title}
                  </span>
                  <button
                    type="button"
                    onClick={clearReference}
                    aria-label="Quitar obra de referencia"
                    className="text-slate-500 hover:text-brand-orange"
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              )}

              <fieldset>
                <FieldLabel n="01">Tipo de trabajo</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {quoteProjectTypes.map((t) => (
                    <label key={t.value}>
                      <input type="radio" value={t.value} {...register("tipoProyecto")} className="peer sr-only" />
                      <span className={chipClass}>{t.label}</span>
                    </label>
                  ))}
                </div>
                <FieldError message={errors.tipoProyecto?.message} />
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
                <div>
                  <FieldLabel n="02" htmlFor="area">
                    Área aproximada
                  </FieldLabel>
                  <div className="relative">
                    <Input id="area" inputMode="decimal" placeholder="32" className={cn(inputClass, "pr-12")} {...register("area")} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">
                      m²
                    </span>
                  </div>
                  <FieldError message={errors.area?.message} />
                </div>

                <fieldset>
                  <FieldLabel n="03">¿Incluimos el material?</FieldLabel>
                  <div className={cn("grid h-11 grid-cols-2 border", fieldLine)}>
                    {[
                      { value: "si", label: "Sí, cotízalo" },
                      { value: "no", label: "Ya lo tengo" },
                    ].map((opt) => (
                      <label key={opt.value} className="h-full">
                        <input type="radio" value={opt.value} {...register("incluirMaterial")} className="peer sr-only" />
                        <span
                          className={cn(
                            "grid h-full cursor-pointer place-items-center text-sm text-slate-600 transition-colors dark:text-slate-400",
                            "peer-checked:bg-brand-orange peer-checked:font-semibold peer-checked:text-slate-950 dark:peer-checked:text-slate-950",
                            "peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-brand-orange"
                          )}
                        >
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
                <div>
                  <FieldLabel n="04" htmlFor="name">
                    Nombre
                  </FieldLabel>
                  <Input id="name" autoComplete="name" placeholder="Juan Pérez" className={inputClass} {...register("name")} />
                  <FieldError message={errors.name?.message} />
                </div>
                <div>
                  <FieldLabel n="05" htmlFor="phone">
                    WhatsApp
                  </FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="099 123 4567"
                    className={inputClass}
                    {...register("phone")}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>
              </div>

              <div>
                <FieldLabel n="06" htmlFor="detalles">
                  Detalles
                </FieldLabel>
                <Textarea
                  id="detalles"
                  rows={3}
                  placeholder="Ciudad, tipo de inmueble, altura del techo, si tienes planos o fotos…"
                  className={cn(inputClass, "h-auto min-h-[88px] py-2.5")}
                  {...register("detalles")}
                />
                <FieldError message={errors.detalles?.message} />
              </div>

              {serverError && (
                <p className="border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {serverError}
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                  {isSubmitting ? "Enviando…" : "Enviar solicitud"}
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <ArrowRight className="size-4" strokeWidth={1.75} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#06260f] transition-colors hover:bg-[#1EBE5D]"
                >
                  <WhatsAppIcon className="size-4" />
                  Enviar por WhatsApp
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

// SVG oficial de WhatsApp (excepción de logo de marca)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
