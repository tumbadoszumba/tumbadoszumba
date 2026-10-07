import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider"
import { ProjectPortfolio } from "@/components/installations/ProjectPortfolio"
import { QuoteForm } from "@/components/installations/QuoteForm"
import {
  FrameCorners,
  SectionTag,
  blueprint,
  btnGhost,
  btnPrimary,
  fieldLine,
  line,
  mutedText,
  pageBg,
} from "@/components/installations/shared"
import { installationProjects } from "@/data/installation-projects"
import { cn } from "@/lib/utils"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Instalación de tumbados y gypsum en La Troncal, Ecuador",
  description:
    "Instalamos tumbados, paredes de gypsum y luz indirecta en La Troncal y alrededores, con el mismo material que vendemos en la tienda. Visita, medidas y presupuesto claro.",
  path: "/instalaciones",
})

const HERO_STORE_IMAGE =
  "https://res.cloudinary.com/dxkmtbde/image/upload/v1788982326/basictech/media/general/jnyg7eq9rcbkzunfppsx.jpg"
const HERO_WORK_IMAGE =
  "https://res.cloudinary.com/dxkmtbde/image/upload/v1788982318/basictech/media/general/teeg4tbo7zkdhodkrahk.jpg"

const processSteps = [
  { title: "Visita y medida", text: "Vamos a tu obra y tomamos las medidas reales del espacio." },
  { title: "Presupuesto claro", text: "Mano de obra y materiales por separado, ítem por ítem." },
  { title: "Estructura", text: "Perfilería galvanizada, nivelada con láser." },
  { title: "Juntas y entrega", text: "Cinta, masilla y superficie lista para pintar." },
]

export default function InstalacionesPage() {
  return (
    <div className={cn("text-slate-900 dark:text-white", pageBg)}>
      {/* Hero: tienda → obra */}
      <header className={cn("border-b", line, blueprint)}>
        <div className="container mx-auto grid items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1fr_1.12fr] lg:gap-12 lg:py-20">
          <div>
            <SectionTag>Servicio de instalación</SectionTag>
            <h1 className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.4rem]">
              Te vendemos el gypsum. <span className="text-brand-orange">Y también lo instalamos.</span>
            </h1>
            <p className={cn("mt-5 max-w-md text-base leading-relaxed", mutedText)}>
              Tumbados, paredes y luz indirecta hechos por nuestros maestros, con el mismo material que vendemos en la
              tienda.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <a href="#cotizar" className={btnPrimary}>
                Cotizar mi obra
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </a>
              <a href="#obras" className={btnGhost}>
                Ver obras terminadas
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] text-slate-500">
              {["Visita", "Medición", "Presupuesto con materiales"].map((step) => (
                <li key={step} className={cn("mr-3 border-r pr-3 last:mr-0 last:border-r-0 last:pr-0", fieldLine)}>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative">
            <FrameCorners />
            <div className={cn("h-[260px] border sm:h-[340px] lg:h-[400px]", line)}>
              <BeforeAfterSlider
                beforeSrc={HERO_STORE_IMAGE}
                afterSrc={HERO_WORK_IMAGE}
                beforeLabel="Nuestra tienda"
                afterLabel="Tu obra"
                subject="de la tienda Tumbados Zumba a un tumbado terminado"
                initialPosition={46}
                sizes="(max-width: 1024px) 100vw, 640px"
                priority
              />
            </div>
            <figcaption
              className={cn(
                "grid grid-cols-[auto_1fr] border border-t-0 font-mono text-[11px] uppercase tracking-[0.06em] sm:grid-cols-[auto_1fr_auto]",
                line
              )}
            >
              <span className="px-3.5 py-2.5 text-brand-orange">Tienda → obra</span>
              <span className={cn("border-l px-3.5 py-2.5", line, mutedText)}>
                El material que ves en tienda, instalado en tu casa
              </span>
              <a
                href="#obras"
                className={cn("hidden border-l px-3.5 py-2.5 text-slate-500 transition-colors hover:text-brand-orange sm:block", line)}
              >
                Ver obras ↓
              </a>
            </figcaption>
          </figure>
        </div>
      </header>

      {/* Cómo trabajamos */}
      <section className={cn("border-b", line)} aria-label="Cómo trabajamos">
        <ol className="container mx-auto grid grid-cols-2 gap-px bg-slate-200 px-0 lg:grid-cols-4 dark:bg-[#1E293B]">
          {processSteps.map((step, i) => (
            <li key={step.title} className={cn("px-4 py-5 sm:px-6 sm:py-6", pageBg)}>
              <span className="font-mono text-xs text-brand-orange">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-2 text-[15px] font-semibold tracking-[-0.01em] sm:text-base">{step.title}</h2>
              <p className={cn("mt-1.5 hidden text-[13px] leading-relaxed sm:block", mutedText)}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <ProjectPortfolio projects={installationProjects} />

      <QuoteForm />
    </div>
  )
}
