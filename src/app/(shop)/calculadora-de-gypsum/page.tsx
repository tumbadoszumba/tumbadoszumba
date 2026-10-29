import type { Metadata } from "next"
import Link from "next/link"
import { DynamicCalculatorSection } from "@/components/home/DynamicCalculatorSection"
import { JsonLd } from "@/components/seo/JsonLd"
import { breadcrumbJsonLd, calculatorJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo"
import { SITE, categoryPath } from "@/lib/site"
import { prisma } from "@/lib/prisma"

// Página propia de la calculadora para que aparezca en Google al buscar «calculadora de gypsum».
// La calculadora es la misma de la portada; aquí va además texto visible en el HTML del servidor.
export const revalidate = 3600

const PATH = "/calculadora-de-gypsum"

export const metadata: Metadata = pageMetadata({
  title: "Calculadora de gypsum para tumbados y paredes",
  description:
    "Calcula gratis las planchas de gypsum, perfilería, tornillos y masilla para tu tumbado o pared. Ingresa los m² y pide tu proforma por WhatsApp.",
  path: PATH,
})

const steps = [
  { title: "Elige el sistema", text: "Tumbado de gypsum, pared o cielo raso, y la plancha que vas a usar." },
  { title: "Ingresa los m²", text: "Escribe el área a instalar en metros cuadrados." },
  { title: "Revisa la lista", text: "Ajusta cantidades, quita o agrega productos de la tienda." },
  { title: "Pide tu proforma", text: "La envías por WhatsApp y te confirmamos precios con tus medidas reales." },
]

const faqs = [
  {
    q: "¿Cuántas planchas de gypsum necesito por metro cuadrado?",
    a: "Una plancha de gypsum de 1,22 × 2,44 m cubre unos 2,98 m². A eso se suma lo que se pierde en cortes, que depende de la forma del espacio. La calculadora te da una cantidad estimada y en la proforma la ajustamos con tus medidas reales.",
  },
  {
    q: "¿Qué materiales calcula además de las planchas?",
    a: "Según el sistema, la perfilería (canales, omegas, primarios, parantes), ángulos perimetrales, clavos y tornillos, cinta para juntas y masilla. Cada material enlaza a su producto en la tienda.",
  },
  {
    q: "¿La calculadora de gypsum es gratis?",
    a: "Sí. No necesitas crear una cuenta: calculas, revisas la lista y, si quieres, pides la proforma por WhatsApp.",
  },
  {
    q: "¿Puedo cambiar las cantidades o agregar otros productos?",
    a: "Sí. Puedes subir o bajar cada cantidad, quitar materiales que ya tienes y agregar otros productos de la tienda con el buscador antes de pedir la proforma.",
  },
  {
    q: `¿También instalan el gypsum en ${SITE.address.city}?`,
    a: `Sí. Instalamos tumbados y paredes de gypsum en ${SITE.address.city} y alrededores, con el mismo material de la tienda. Puedes pedir una visita desde la página de instalaciones.`,
  },
]

export default async function CalculadoraGypsumPage() {
  // Sistemas activos de la calculadora, para describirlos en texto (no solo dentro del componente)
  const systems = await prisma.calculator
    .findMany({
      where: { isActive: true },
      select: { name: true, description: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    })
    .catch(() => [])

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <JsonLd data={calculatorJsonLd({ path: PATH, name: "Calculadora de gypsum", description: metadata.description as string })} />
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Calculadora de gypsum", path: PATH },
        ])}
      />

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <nav aria-label="Migas de pan" className="text-xs text-slate-500">
          <Link href="/" className="hover:text-brand-orange">
            Inicio
          </Link>
          <span className="mx-1.5">/</span>
          <span>Calculadora de gypsum</span>
        </nav>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculadora de gypsum</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Calcula cuántas planchas de gypsum (placa de yeso o drywall), perfilería, tornillos, cinta y masilla
              necesitas para tu tumbado o tu pared. Ingresa los metros cuadrados, revisa la lista y pide tu proforma
              por WhatsApp a {SITE.name}, en {SITE.address.city}, {SITE.address.region}.
            </p>

            <h2 className="mt-8 text-lg font-bold tracking-tight">Cómo usar la calculadora</h2>
            <ol className="mt-3 grid gap-3 sm:grid-cols-2">
              {steps.map((step, i) => (
                <li key={step.title} className="border border-slate-200 p-4 dark:border-slate-800">
                  <span className="font-mono text-xs font-bold text-brand-orange">0{i + 1}</span>
                  <p className="mt-1 text-sm font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{step.text}</p>
                </li>
              ))}
            </ol>

            {systems.length > 0 && (
              <>
                <h2 className="mt-8 text-lg font-bold tracking-tight">Sistemas que calcula</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {systems.map((system) => (
                    <li key={system.name}>
                      <span className="font-semibold text-slate-900 dark:text-white">{system.name}</span>
                      {system.description ? ` — ${system.description}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
              Las cantidades son una estimación; las confirmamos en la proforma con tus medidas reales. Mira también
              las{" "}
              <Link href={categoryPath("gypsum")} className="font-medium text-brand-orange underline underline-offset-2">
                placas de yeso y accesorios
              </Link>{" "}
              de la tienda o, si prefieres que lo hagamos nosotros, el{" "}
              <Link href="/instalaciones" className="font-medium text-brand-orange underline underline-offset-2">
                servicio de instalación de tumbados
              </Link>
              .
            </p>
          </div>

          {/* Sin «sticky»: crearía un contexto de apilamiento y la ventana de resultados quedaría bajo el encabezado */}
          <div className="lg:self-start">
            <DynamicCalculatorSection />
          </div>
        </div>

        <section aria-labelledby="faq-calculadora" className="mt-12 max-w-3xl">
          <h2 id="faq-calculadora" className="text-lg font-bold tracking-tight">
            Preguntas frecuentes sobre la calculadora de gypsum
          </h2>
          <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-3">
                <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">{faq.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
